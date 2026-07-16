import { StyleSheet } from 'react-native';

/** Plain style objects for ViroText (Viro accepts a subset of RN text styles). */
export const arTextStyles = {
  segment: { fontFamily: 'sans-serif', fontSize: 26, color: '#ffffff', textAlign: 'center', textAlignVertical: 'center' },
  live: { fontFamily: 'sans-serif', fontSize: 24, color: '#e9edf5', textAlign: 'center', textAlignVertical: 'center' },
  area: { fontFamily: 'sans-serif', fontSize: 30, color: '#ffb23e', textAlign: 'center', textAlignVertical: 'center' },
} as const;

/** RN overlay chrome (top bar, crosshair, controls, banners). */
export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  ar: { flex: 1 },

  centerWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  crosshair: { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  chip: { backgroundColor: 'rgba(20,15,10,0.55)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13, alignItems: 'center' },
  chipTxt: { color: '#fff', fontSize: 13 },
  chipContext: { color: '#ffb23e', fontSize: 11, fontWeight: '800' },

  modeWrap: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingTop: 50 },
  modeSeg: { flexDirection: 'row', backgroundColor: 'rgba(20,15,10,0.6)', borderRadius: 999, padding: 3, gap: 3 },
  modeBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 999 },
  modeBtnOn: { backgroundColor: '#ffb23e' },
  modeTxt: { fontSize: 12.5 },

  bannerWrap: { position: 'absolute', top: '21%', left: 24, right: 24, alignItems: 'center' },
  warn: { color: '#fff', backgroundColor: 'rgba(225,29,72,0.92)', textAlign: 'center', fontSize: 14, fontWeight: '800', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  hint: { color: '#fff', backgroundColor: 'rgba(20,15,10,0.6)', textAlign: 'center', fontSize: 13.5, fontWeight: '600', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, overflow: 'hidden' },

  liveWrap: { position: 'absolute', top: '50%', left: 0, right: 0, alignItems: 'center', marginTop: 26 },
  liveTxt: { color: '#fff', backgroundColor: 'rgba(255,106,61,0.9)', fontSize: 15, fontWeight: '800', paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999, overflow: 'hidden' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  btn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  btnMain: { flex: 1.6, backgroundColor: '#ff6a3d', paddingHorizontal: 8 },
  btnMainTxt: { color: '#fff', fontSize: 15 },
  btnToggle: { flex: 1, backgroundColor: 'rgba(20,15,10,0.6)' },
  btnToggleOn: { backgroundColor: '#ffb23e' },
  btnUndo: { width: 54, backgroundColor: 'rgba(20,15,10,0.55)' },
  btnTxt: { fontSize: 14 },

  helpBtn: {
    position: 'absolute',
    right: 14,
    top: '40%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(20,15,10,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTxt: { color: '#fff', fontSize: 19 },

  levelWrap: {
    position: 'absolute',
    right: 14,
    top: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(20,15,10,0.6)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  levelDot: { width: 12, height: 12, borderRadius: 6 },
  levelTxt: { color: '#fff', fontSize: 12 },

  saveBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 84,
    backgroundColor: '#2bd576',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTxt: { color: '#08301c', fontSize: 15 },
});
