<?php

namespace Database\Seeders;

use App\Enums\PartAction;
use App\Enums\PhotoPhase;
use App\Enums\ProposalStatus;
use App\Enums\RequestStatus;
use App\Enums\RequestUrgency;
use App\Enums\SurchargeStatus;
use App\Enums\SurchargeTier;
use App\Models\JobPart;
use App\Models\Media;
use App\Models\Proposal;
use App\Models\ProviderLocation;
use App\Models\ProviderProfile;
use App\Models\ServiceCategory;
use App\Models\ServiceRequest;
use App\Models\Surcharge;
use App\Models\User;
use Database\Seeders\Concerns\SeedsNearbyLocations;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

/**
 * Gives the dev client (cliente@walvee.test) a solicitation in EVERY stage, and
 * matches the dev provider (prestador@walvee.test) on the active ones, so every
 * flow is reachable out of the box. Each stage uses a distinct category so they
 * coexist; the remaining categories stay "open" for the provider feed.
 *
 *   open + propostas   → guincho        (choose-proposal screen, 3 competing bids)
 *   open + já dei lance → bateria         (provider "already bid" state)
 *   accepted (a caminho)→ pneu           (start code shown to the client)
 *   in_progress         → mecanico       (parts approval pending + pending surcharge)
 *   completed           → encanador      (settlement w/ parts + surcharge, receipt, rating)
 *   requote             → eletricista    (surcharge >50% → mandatory re-quote)
 *   cancelled           → chaveiro
 *   expired             → combustivel
 *
 * Idempotent: keyed on (client, category) + (request, provider). Runs after
 * ServiceRequestSeeder so it wins over the plain "open" state. Dev/test only.
 */
class DevJobSeeder extends Seeder
{
    use SeedsNearbyLocations;

    private const START_CODE = '2468';

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $client = User::where('email', 'cliente@walvee.test')->first();
        $provider = User::where('email', 'prestador@walvee.test')->first();
        if (! $client || ! $provider) {
            return;
        }

        // OPEN with competing proposals — the client can compare and choose.
        $this->seedOpenWithProposals($client, 'guincho');

        // OPEN where the dev provider has already bid — "proposta enviada" state.
        $this->seedProviderBid($client, $provider, 'bateria', 130.0);

        // ACCEPTED — provider en route; the client sees the start code.
        $this->matchJob($client, $provider, 'pneu', RequestStatus::Accepted, 140.0, [
            'accepted_at' => now()->subMinutes(15),
            'start_code' => self::START_CODE,
        ]);

        // IN PROGRESS — parts approval pending + a pending (reinforced) surcharge.
        $job = $this->matchJob($client, $provider, 'mecanico', RequestStatus::InProgress, 180.0, [
            'accepted_at' => now()->subHours(2),
            'started_at' => now()->subHour(),
            'start_code' => self::START_CODE,
            'parts_approval_requested_at' => now()->subMinutes(20),
        ]);
        if ($job) {
            $this->addPart($job, 'Pastilha de freio', PartAction::Replaced, 1, 90.0);
            $this->addSurcharge($job, $provider, 40.0, SurchargeTier::Reinforced, SurchargeStatus::Pending, 'Peça adicional necessária', 180.0);
            $this->attachPhoto($job, PhotoPhase::Before, [234, 88, 12], 1);
        }

        // COMPLETED — settlement = labor 220 + parts 50 + approved surcharge 30 = 300.
        $done = $this->matchJob($client, $provider, 'encanador', RequestStatus::Completed, 220.0, [
            'accepted_at' => now()->subHours(3),
            'started_at' => now()->subHours(2),
            'completed_at' => now()->subMinutes(20),
            'start_code' => self::START_CODE,
            'parts_approval_requested_at' => now()->subHours(2),
            'parts_approved_at' => now()->subMinutes(90),
        ]);
        if ($done) {
            $this->addPart($done, 'Sifão sanfonado', PartAction::Replaced, 2, 25.0);
            $this->addSurcharge($done, $provider, 30.0, SurchargeTier::Simple, SurchargeStatus::Approved, 'Conexão extra', 220.0);
            $this->attachPhoto($done, PhotoPhase::Before, [234, 88, 12], 1);
            $this->attachPhoto($done, PhotoPhase::After, [22, 163, 74], 1);
        }

        // REQUOTE — surcharge >50% forced a mandatory re-quote (client must decide).
        $requote = $this->matchJob($client, $provider, 'eletricista', RequestStatus::Requote, 160.0, [
            'accepted_at' => now()->subHours(2),
            'started_at' => now()->subHour(),
            'start_code' => self::START_CODE,
        ]);
        if ($requote) {
            $this->addSurcharge($requote, $provider, 120.0, SurchargeTier::Requote, SurchargeStatus::Pending, 'Escopo muito maior que o previsto', 160.0);
        }

        // CANCELLED + EXPIRED — terminal client-side states.
        $this->terminate($client, 'chaveiro', RequestStatus::Cancelled, [
            'cancelled_at' => now()->subDay(),
            'cancelled_reason' => 'Resolvido por conta própria.',
        ]);
        $this->terminate($client, 'combustivel', RequestStatus::Expired, []);
    }

    /** Match a request to the dev provider and advance it to $status. */
    private function matchJob(User $client, User $provider, string $slug, RequestStatus $status, float $price, array $extra = []): ?ServiceRequest
    {
        $category = ServiceCategory::where('slug', $slug)->first();
        if (! $category) {
            return null;
        }

        $request = ServiceRequest::firstOrNew([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
        ]);
        $request->fill([
            'description' => 'Solicitação de teste ('.$category->name.') — '.$status->value.'.',
            ...$this->randomNearbyLocation(),
            'address' => 'Av. Bady Bassitt, 1500 - São José do Rio Preto, SP',
            'budget_max' => $price,
        ])->save();

        $proposal = Proposal::updateOrCreate(
            ['service_request_id' => $request->id, 'provider_id' => $provider->id],
            ['price' => $price, 'eta_minutes' => 20, 'status' => ProposalStatus::Accepted->value],
        );
        Proposal::where('service_request_id', $request->id)
            ->where('id', '!=', $proposal->id)
            ->update(['status' => ProposalStatus::Rejected->value]);

        // Start code is an urgent-only mechanism (see ProposalService::accept).
        if ($request->urgency !== RequestUrgency::Urgent) {
            unset($extra['start_code']);
        }

        $request->update(array_merge([
            'status' => $status->value,
            'accepted_proposal_id' => $proposal->id,
            'accepted_provider_id' => $provider->id,
            'accepted_at' => now()->subHours(2),
            'started_at' => null,
            'completed_at' => null,
        ], $extra));

        return $request->fresh();
    }

    /** Leave a request open and seed competing proposals from sample providers. */
    private function seedOpenWithProposals(User $client, string $slug): void
    {
        $category = ServiceCategory::where('slug', $slug)->first();
        if (! $category) {
            return;
        }

        $request = ServiceRequest::firstOrNew([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
        ]);
        $request->fill([
            'description' => 'Solicitação de teste ('.$category->name.') — recebendo propostas.',
            ...$this->randomNearbyLocation(),
            'address' => 'Av. Bady Bassitt, 1500 - São José do Rio Preto, SP',
            'budget_max' => 160.0,
            'status' => RequestStatus::Open->value,
            'accepted_proposal_id' => null,
            'accepted_provider_id' => null,
        ])->save();

        // Client's reference photos at creation (shown to bidders).
        $this->attachPhoto($request, PhotoPhase::Request, [37, 99, 235], 1);
        $this->attachPhoto($request, PhotoPhase::Request, [13, 148, 136], 2);

        $bidders = [
            ['email' => 'joao@walvee.test', 'name' => 'João Mecânico', 'rating' => 4.9, 'count' => 213, 'jobs' => 240, 'price' => 150.0, 'eta' => 15, 'comment' => 'Chego rápido, peças inclusas.'],
            ['email' => 'maria@walvee.test', 'name' => 'Maria Express', 'rating' => 4.7, 'count' => 98, 'jobs' => 110, 'price' => 175.0, 'eta' => 10, 'comment' => 'Atendimento premium com garantia.'],
            ['email' => 'carlos@walvee.test', 'name' => 'Carlos 24h', 'rating' => 4.4, 'count' => 41, 'jobs' => 52, 'price' => 130.0, 'eta' => 30, 'comment' => 'Melhor preço da região.'],
        ];

        foreach ($bidders as $b) {
            $bidder = $this->makeProvider($b['email'], $b['name'], $b['rating'], $b['count'], $b['jobs']);
            Proposal::updateOrCreate(
                ['service_request_id' => $request->id, 'provider_id' => $bidder->id],
                ['price' => $b['price'], 'eta_minutes' => $b['eta'], 'comment' => $b['comment'], 'status' => ProposalStatus::Pending->value],
            );
        }
    }

    /** Leave a request open with a single pending bid from the dev provider. */
    private function seedProviderBid(User $client, User $provider, string $slug, float $price): void
    {
        $category = ServiceCategory::where('slug', $slug)->first();
        if (! $category) {
            return;
        }

        $request = ServiceRequest::firstOrNew([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
        ]);
        $request->fill([
            'description' => 'Solicitação de teste ('.$category->name.') — você já enviou proposta.',
            ...$this->randomNearbyLocation(),
            'address' => 'Av. Bady Bassitt, 1500 - São José do Rio Preto, SP',
            'budget_max' => $price,
            'status' => RequestStatus::Open->value,
            'accepted_proposal_id' => null,
            'accepted_provider_id' => null,
        ])->save();

        Proposal::updateOrCreate(
            ['service_request_id' => $request->id, 'provider_id' => $provider->id],
            ['price' => $price, 'eta_minutes' => 18, 'comment' => 'Posso ir agora.', 'status' => ProposalStatus::Pending->value],
        );
    }

    /** Advance a request to a terminal client-side status (cancelled/expired). */
    private function terminate(User $client, string $slug, RequestStatus $status, array $extra): void
    {
        $category = ServiceCategory::where('slug', $slug)->first();
        if (! $category) {
            return;
        }

        $request = ServiceRequest::firstOrNew([
            'client_id' => $client->id,
            'service_category_id' => $category->id,
        ]);
        $request->fill([
            'description' => 'Solicitação de teste ('.$category->name.') — '.$status->value.'.',
            ...$this->randomNearbyLocation(),
            'address' => 'Av. Bady Bassitt, 1500 - São José do Rio Preto, SP',
            'budget_max' => 120.0,
        ])->save();

        $request->update(array_merge(['status' => $status->value], $extra));
    }

    private function addPart(ServiceRequest $request, string $name, PartAction $action, int $qty, float $unitPrice): void
    {
        JobPart::updateOrCreate(
            ['service_request_id' => $request->id, 'name' => $name],
            ['action' => $action->value, 'quantity' => $qty, 'unit_price' => $unitPrice],
        );
    }

    private function addSurcharge(ServiceRequest $request, User $provider, float $amount, SurchargeTier $tier, SurchargeStatus $status, string $reason, float $combinado): void
    {
        $percent = $combinado > 0 ? round($amount / $combinado * 100, 2) : 0;
        Surcharge::updateOrCreate(
            ['service_request_id' => $request->id, 'provider_id' => $provider->id, 'reason' => $reason],
            [
                'amount' => $amount,
                'percent_accumulated' => $percent,
                'tier' => $tier->value,
                'status' => $status->value,
                'resolved_at' => $status === SurchargeStatus::Pending ? null : now()->subMinutes(30),
            ],
        );
    }

    /** Write a placeholder image to the public disk and attach it as a media row. */
    private function attachPhoto(ServiceRequest $request, PhotoPhase $phase, array $rgb, int $n): void
    {
        $path = "requests/{$request->id}/seed-{$phase->value}-{$n}.png";
        Storage::disk('public')->put($path, $this->solidPng($rgb[0], $rgb[1], $rgb[2]));

        Media::updateOrCreate(
            ['mediable_type' => ServiceRequest::class, 'mediable_id' => $request->id, 'path' => $path],
            [
                'tag' => $phase->value,
                'disk' => 'public',
                'uploaded_by_id' => $phase === PhotoPhase::Request ? $request->client_id : $request->accepted_provider_id,
            ],
        );
    }

    /**
     * Build a valid solid-colour PNG entirely in PHP (no GD / no network), so
     * seeded requests display a real image. Color type 2 (RGB), zlib-deflated.
     */
    private function solidPng(int $r, int $g, int $b, int $size = 240): string
    {
        $chunk = static fn (string $type, string $data): string => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));

        $ihdr = pack('N', $size).pack('N', $size)."\x08\x02\x00\x00\x00"; // 8-bit, RGB
        $pixel = chr($r).chr($g).chr($b);
        $row = "\x00".str_repeat($pixel, $size); // filter byte 0 + scanline
        $raw = str_repeat($row, $size);
        $idat = gzcompress($raw, 9);

        return "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', $idat).$chunk('IEND', '');
    }

    /** A sample approved/online provider used as a competing bidder. */
    private function makeProvider(string $email, string $name, float $rating, int $ratingCount, int $jobs): User
    {
        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => 'senha123', 'is_client' => false, 'is_provider' => true],
        );

        ProviderProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => $name,
                'is_approved' => true,
                'is_online' => true,
                'coverage_radius_km' => 30,
                'rating_avg' => $rating,
                'rating_count' => $ratingCount,
                'jobs_completed' => $jobs,
            ],
        );

        $user->categories()->sync(ServiceCategory::where('is_active', true)->pluck('id')->all());

        ProviderLocation::updateOrCreate(
            ['user_id' => $user->id],
            $this->randomNearbyLocation(),
        );

        return $user;
    }
}
