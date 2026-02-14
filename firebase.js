/* eslint-disable global-require */

var _ASModule = require('@react-native-async-storage/async-storage');
var _AS = _ASModule && _ASModule.default ? _ASModule.default : _ASModule;

if (typeof global.localStorage === 'undefined') {
  var _cache = Object.create(null);

  (async function () {
    try {
      var keys = await _AS.getAllKeys();
      if (keys && keys.length) {
        var entries = await _AS.multiGet(keys);
        for (var i = 0; i < entries.length; i++) {
          _cache[entries[i][0]] = entries[i][1];
        }
      }
    } catch (e) {}
  })();

  var _local = {
    getItem: function (key) {
      return Object.prototype.hasOwnProperty.call(_cache, key) ? _cache[key] : null;
    },
    setItem: function (key, value) {
      _cache[key] = String(value);
      _AS.setItem(key, String(value)).catch(function () {});
    },
    removeItem: function (key) {
      delete _cache[key];
      _AS.removeItem(key).catch(function () {});
    },
    clear: function () {
      var k;
      for (k in _cache) {
        if (Object.prototype.hasOwnProperty.call(_cache, k)) delete _cache[k];
      }
      _AS.clear().catch(function () {});
    },
  };

  try {
    global.localStorage = _local;
    if (typeof global.window === 'undefined') global.window = global;
    if (typeof global.self === 'undefined') global.self = global;
    if (typeof global.globalThis === 'undefined') global.globalThis = global;
    global.window.localStorage = _local;
    global.self.localStorage = _local;
    global.globalThis.localStorage = _local;
  } catch (e) {}
}

// Stub addEventListener/removeEventListener on window/global if missing.
// Firebase auth compat (BrowserLocalPersistence) calls
// window.addEventListener('storage', ...) which doesn't exist in RN.
if (typeof global.window !== 'undefined') {
  if (typeof global.window.addEventListener !== 'function') {
    global.window.addEventListener = function () {};
  }
  if (typeof global.window.removeEventListener !== 'function') {
    global.window.removeEventListener = function () {};
  }
}

var _fbModule = require('firebase/compat/app');
var firebase = _fbModule && _fbModule.default ? _fbModule.default : _fbModule;
require('firebase/compat/auth');
require('firebase/compat/firestore');
require('firebase/compat/storage');

var firebaseConfig = {
  apiKey: 'AIzaSyDzjB8yg7YLsTvOCbgXeE5A5kltG2cg4fE',
  authDomain: 'chatapp1-c2ded.firebaseapp.com',
  projectId: 'chatapp1-c2ded',
  storageBucket: 'chatapp1-c2ded.firebasestorage.app',
  messagingSenderId: '390047300552',
  appId: '1:390047300552:web:c3cc24be8a52e52dcadefd',
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

var _auth = firebase.auth();
try {
  if (_auth.setPersistence) _auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
} catch (e) {}

function auth() {
  return _auth;
}
function signInWithEmailAndPassword(a, email, password) {
  return a.signInWithEmailAndPassword(email, password);
}
function createUserWithEmailAndPassword(a, email, password) {
  return a.createUserWithEmailAndPassword(email, password);
}
function signOut(a) {
  return a.signOut();
}
function onAuthStateChanged(a, cb) {
  return a.onAuthStateChanged(cb);
}

var db = firebase.firestore();
var storage = firebase.storage();

function collection(ref) {
  var cur = ref;
  for (var i = 1; i < arguments.length; i++) {
    if ((i - 1) % 2 === 0) cur = cur.collection(arguments[i]);
    else cur = cur.doc(arguments[i]);
  }
  return cur;
}

function doc(ref) {
  if (arguments.length === 1) return ref.doc();
  if (arguments.length === 2) return ref.doc(arguments[1]);
  var cur = ref;
  for (var i = 1; i < arguments.length; i++) {
    if ((i - 1) % 2 === 0) cur = cur.collection(arguments[i]);
    else cur = cur.doc(arguments[i]);
  }
  return cur;
}

function addDoc(colRef, data) {
  return colRef.add(data);
}
function setDoc(docRef, data, options) {
  return options ? docRef.set(data, options) : docRef.set(data);
}
function updateDoc(docRef, data) {
  return docRef.update(data);
}
function deleteDoc(docRef) {
  return docRef.delete();
}
// --- Helpers to patch compat snapshots so call-sites can rely on .exists()
function _ensureExistsMethodOnDoc(doc) {
  if (!doc) return doc;
  // If exists is already a function, nothing to do
  if (typeof doc.exists === 'function') return doc;
  // If exists is a boolean or other value, capture it
  var existsFlag = !!doc.exists;
  try {
    // Prefer defining a non-enumerable function property directly on the snapshot
    Object.defineProperty(doc, 'exists', {
      value: function () { return existsFlag; },
      configurable: true,
      enumerable: false,
      writable: false,
    });
    return doc;
  } catch (e) {
    // If direct definition fails (frozen/immutable object), try Proxy fallback
    try {
      return new Proxy(doc, {
        get: function (target, prop) {
          if (prop === 'exists') return function () { return !!target.exists; };
          var v = target[prop];
          return typeof v === 'function' ? v.bind(target) : v;
        }
      });
    } catch (err) {
      // If Proxy is unavailable or also fails, return original doc
      return doc;
    }
  }
}

function _patchQuerySnapshot(qSnap) {
  if (!qSnap) return qSnap;
  try {
    var docs = qSnap.docs || [];
    for (var i = 0; i < docs.length; i++) {
      var patched = _ensureExistsMethodOnDoc(docs[i]);
      // If we created a proxy, attempt to replace the array element (safe in most cases)
      if (patched !== docs[i]) {
        try { docs[i] = patched; } catch (e) { /* ignore if read-only */ }
      }
    }

    // Patch any docChanges entries' doc field as well
    if (typeof qSnap.docChanges === 'function') {
      try {
        var changes = qSnap.docChanges();
        for (var j = 0; j < changes.length; j++) {
          if (changes[j] && changes[j].doc) {
            changes[j].doc = _ensureExistsMethodOnDoc(changes[j].doc);
          }
        }
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore any patching errors
  }
  return qSnap;
}

function getDoc(docRef) {
  return docRef.get().then(function (docSnap) {
    return _ensureExistsMethodOnDoc(docSnap);
  });
}

function getDocs(queryRef) {
  return queryRef.get().then(function (qSnap) {
    return _patchQuerySnapshot(qSnap);
  });
}

function query(colRef) {
  var q = colRef;
  for (var i = 1; i < arguments.length; i++) q = arguments[i](q);
  return q;
}
function where(field, op, value) {
  return function (q) { return q.where(field, op, value); };
}
function orderBy(field, direction) {
  return function (q) { return q.orderBy(field, direction || 'asc'); };
}
function limit(n) {
  return function (q) { return q.limit(n); };
}

function onSnapshot(ref, cb, onErr) {
  // Wrap user's callback so snapshots are patched to include exists() on docs
  return ref.onSnapshot(function (snap) {
    try {
      if (snap && Array.isArray(snap.docs)) {
        cb(_patchQuerySnapshot(snap));
      } else {
        cb(_ensureExistsMethodOnDoc(snap));
      }
    } catch (e) {
      // fallback: pass original snapshot
      cb(snap);
    }
  }, onErr || function () {});
}
function serverTimestamp() {
  return firebase.firestore.FieldValue.serverTimestamp();
}
function ref(storageInst, path) {
  return storageInst.ref(path);
}
function uploadBytes(sRef, blob) {
  return sRef.put(blob);
}
function getDownloadURL(sRef) {
  return sRef.getDownloadURL();
}

var usersRef = db.collection('users');
var messagesRef = db.collection('messages');
var contactsRef = db.collection('contacts');
var callsRef = db.collection('calls');
var chatsRef = db.collection('chats');

module.exports = {
  auth: auth,
  signInWithEmailAndPassword: signInWithEmailAndPassword,
  createUserWithEmailAndPassword: createUserWithEmailAndPassword,
  signOut: signOut,
  onAuthStateChanged: onAuthStateChanged,
  db: db,
  collection: collection,
  doc: doc,
  addDoc: addDoc,
  setDoc: setDoc,
  updateDoc: updateDoc,
  deleteDoc: deleteDoc,
  getDoc: getDoc,
  getDocs: getDocs,
  query: query,
  where: where,
  orderBy: orderBy,
  limit: limit,
  onSnapshot: onSnapshot,
  serverTimestamp: serverTimestamp,
  storage: storage,
  ref: ref,
  uploadBytes: uploadBytes,
  getDownloadURL: getDownloadURL,
  usersRef: usersRef,
  messagesRef: messagesRef,
  contactsRef: contactsRef,
  callsRef: callsRef,
  chatsRef: chatsRef,
};
