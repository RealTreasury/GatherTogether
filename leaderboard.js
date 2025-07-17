import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function submitScore(db, userId, name, score) {
  const ref = collection(db, "leaderboard");
  const snapshot = await getDocs(ref);
  const match = snapshot.docs.find(d => d.data().userId === userId);

  if (match) {
    await updateDoc(doc(db, "leaderboard", match.id), { name, score });
  } else {
    await addDoc(ref, { userId, name, score });
  }
}

export async function getTopScores(db, count = 10) {
  const ref = collection(db, "leaderboard");
  const q = query(ref, orderBy("score", "desc"), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
