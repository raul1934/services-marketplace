<?php

namespace App\Filament\Resources;

use App\Filament\Resources\RescueContactResource\Pages;
use App\Models\RescueContact;
use App\Models\ServiceCategory;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Fila de resgate — os profissionais que a operação liga quando um chamado fica
 * sem proposta.
 *
 * Existe como tela porque o cadastro acontece em campo, no celular, logo depois
 * da visita — não adianta depender de SQL para isso.
 */
class RescueContactResource extends Resource
{
    protected static ?string $model = RescueContact::class;

    protected static ?string $navigationIcon = 'heroicon-o-phone-arrow-up-right';

    protected static ?string $navigationLabel = 'Fila de resgate';

    protected static ?string $modelLabel = 'contato de resgate';

    protected static ?string $pluralModelLabel = 'fila de resgate';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->label('Nome')->required()->maxLength(255),
            Forms\Components\TextInput::make('company')
                ->label('Empresa')->maxLength(255)
                ->helperText('Oficina, auto center, guincho — como a pessoa se apresenta.'),
            Forms\Components\TextInput::make('phone')
                ->label('Telefone')->required()->tel()->maxLength(30)
                ->helperText('Com DDD. É por aqui que a ligação sai do alerta.'),
            Forms\Components\TextInput::make('city')
                ->label('Cidade')->required()->maxLength(120)
                ->default('São José do Rio Preto'),
            Forms\Components\TextInput::make('uf')->label('UF')->maxLength(2)->default('SP'),

            Forms\Components\Select::make('categories')
                ->label('Atende')
                ->multiple()
                ->options(fn () => ServiceCategory::query()
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->pluck('name', 'slug')
                    ->all())
                ->helperText('Em branco = aparece para qualquer categoria. Numa praça pequena isso costuma ser o certo.'),

            // O consentimento é o que separa a fila de uma lista raspada. Sem
            // ele o contato não entra em alerta nenhum.
            Forms\Components\Section::make('Consentimento')
                ->description('Telefone de MEI é dado pessoal. Sem registro de quando e como a pessoa autorizou, o contato não entra em nenhum alerta.')
                ->schema([
                    Forms\Components\DateTimePicker::make('consent_at')
                        ->label('Autorizou em')
                        ->helperText('Deixe vazio enquanto não houver autorização — o contato fica salvo, mas não é acionado.'),
                    Forms\Components\TextInput::make('consent_source')
                        ->label('Como autorizou')->maxLength(255)
                        ->placeholder('Visita presencial em 20/07, WhatsApp, telefone...'),
                ])->columns(2),

            Forms\Components\TextInput::make('priority')
                ->label('Prioridade')->numeric()->default(50)->minValue(0)->maxValue(100)
                ->helperText('Maior aparece primeiro. Entre iguais, quem foi chamado há mais tempo vem antes.'),
            Forms\Components\Toggle::make('is_active')->label('Ativo')->default(true),
            Forms\Components\Textarea::make('notes')
                ->label('Observações')->rows(2)
                ->helperText('Aparece no alerta. Ex.: "só até 22h", "não faz moto", "cobra taxa de saída".')
                ->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->label('Nome')->searchable()
                    ->description(fn (RescueContact $r) => $r->company),
                Tables\Columns\TextColumn::make('phone')->label('Telefone')->searchable(),
                Tables\Columns\TextColumn::make('city')->label('Cidade')->searchable()->toggleable(),
                Tables\Columns\TextColumn::make('categories')->label('Atende')
                    ->formatStateUsing(fn ($state) => $state ? implode(', ', (array) $state) : 'todas')
                    ->wrap(),
                Tables\Columns\IconColumn::make('consent_at')->label('Autorizado')
                    ->boolean()
                    ->tooltip(fn (RescueContact $r) => $r->consent_at
                        ? 'Autorizou em '.$r->consent_at->format('d/m/Y').($r->consent_source ? " — {$r->consent_source}" : '')
                        : 'Sem autorização: não entra em alerta'),
                Tables\Columns\IconColumn::make('is_active')->label('Ativo')->boolean(),
                Tables\Columns\TextColumn::make('last_called_at')->label('Última ligação')
                    ->since()->placeholder('nunca')->toggleable(),
            ])
            ->defaultSort('priority', 'desc')
            ->filters([
                Tables\Filters\Filter::make('acionavel')
                    ->label('Só quem pode ser acionado')
                    ->query(fn ($q) => $q->acionavel()),
            ])
            ->actions([Tables\Actions\EditAction::make()])
            ->bulkActions([Tables\Actions\DeleteBulkAction::make()]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRescueContacts::route('/'),
            'create' => Pages\CreateRescueContact::route('/create'),
            'edit' => Pages\EditRescueContact::route('/{record}/edit'),
        ];
    }
}
