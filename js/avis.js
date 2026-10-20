// =====================================================================
//  BOUTON « DONNER MON AVIS »
//  Ouvre le formulaire des testeurs (lien réglé dans data/config.js).
// =====================================================================

const lienAvis = (window.VOLTGUIDE_CONFIG || {}).lienAvis;

if (lienAvis) {
  const bloc = $("bloc-avis");
  bloc.querySelector("a").href = lienAvis;
  bloc.hidden = false;
}
