// Firebase compat initialized in the page (login/index). Rely on global firebase object.
const app = firebase.app();
const auth = firebase.auth();
const db = firebase.firestore();

function onAuthStateChange(callback) {
  return auth.onAuthStateChanged(callback);
}

function signIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function signOutUser() {
  return auth.signOut();
}

async function getAdminStatus(user) {
  if (!user) return { isAdmin: false };
  const token = await user.getIdTokenResult(true);
  return { isAdmin: !!token.claims.admin };
}

window.Auth = {
  app,
  auth,
  db,
  onAuthStateChange,
  signIn,
  signOutUser,
  getAdminStatus
};
