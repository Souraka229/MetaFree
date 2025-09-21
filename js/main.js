// /js/main.js
import { auth, db, storage } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { 
  collection, addDoc, getDocs, query, where, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

// Authentication
onAuthStateChanged(auth, (user) => {
  const logoutBtn = document.getElementById('logout-btn');
  const authSection = document.getElementById('auth-section');
  const profileSection = document.getElementById('profile-section');
  const shopSetup = document.getElementById('shop-setup');
  const shopContent = document.getElementById('shop-content');

  if (user) {
    logoutBtn.style.display = 'inline';
    if (authSection) authSection.style.display = 'none';
    if (profileSection) {
      profileSection.style.display = 'block';
      document.getElementById('user-email').textContent = user.email;
    }
    if (shopSetup && shopContent) loadShop(user.uid);
  } else {
    logoutBtn.style.display = 'none';
    if (authSection) authSection.style.display = 'block';
    if (profileSection) profileSection.style.display = 'none';
    if (shopSetup && shopContent) shopSetup.style.display = 'block';
  }
});

// Login
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('Connexion réussie !');
    window.location.href = '../index.html';
  } catch (error) {
    alert('Erreur de connexion : ' + error.message);
  }
});

// Signup
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('Inscription réussie !');
    window.location.href = '../index.html';
  } catch (error) {
    alert('Erreur d\'inscription : ' + error.message);
  }
});

// Update Password
document.getElementById('update-password-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('new-password').value;
  try {
    await updatePassword(auth.currentUser, newPassword);
    alert('Mot de passe mis à jour !');
  } catch (error) {
    alert('Erreur : ' + error.message);
  }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = '../index.html';
});

// Load Products (Home Page)
async function loadProducts() {
  const productList = document.getElementById('product-list');
  if (!productList) return;
  productList.innerHTML = '';
  const querySnapshot = await getDocs(collection(db, 'products'));
  querySnapshot.forEach((doc) => {
    const product = doc.data();
    const productCard = `
      <div class="product-card">
        <img src="${product.imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price} €</p>
        <a href="pages/produit.html?id=${doc.id}">Voir détails</a>
      </div>`;
    productList.innerHTML += productCard;
  });
}

// Load Shops for Filter
async function loadShops() {
  const shopFilter = document.getElementById('shop-filter');
  if (!shopFilter) return;
  const querySnapshot = await getDocs(collection(db, 'shops'));
  querySnapshot.forEach((doc) => {
    const shop = doc.data();
    shopFilter.innerHTML += `<option value="${doc.id}">${shop.name}</option>`;
  });
}

// Search and Filter Products
document.getElementById('search-bar')?.addEventListener('input', async (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const category = document.getElementById('category-filter')?.value;
  const shop = document.getElementById('shop-filter')?.value;
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  let q = collection(db, 'products');
  if (category) q = query(q, where('category', '==', category));
  if (shop) q = query(q, where('shopId', '==', shop));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    const product = doc.data();
    if (product.name.toLowerCase().includes(searchTerm)) {
      productList.innerHTML += `
        <div class="product-card">
          <img src="${product.imageUrl}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>${product.price} €</p>
          <a href="pages/produit.html?id=${doc.id}">Voir détails</a>
        </div>`;
    }
  });
});

// Create Shop
document.getElementById('shop-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const shopName = document.getElementById('shop-name').value;
  const template = document.getElementById('template-select').value;
  try {
    const docRef = await addDoc(collection(db, 'shops'), {
      name: shopName,
      template,
      userId: auth.currentUser.uid
    });
    alert('Boutique créée !');
    loadShop(auth.currentUser.uid);
  } catch (error) {
    alert('Erreur : ' + error.message);
  }
});

// Load Shop
async function loadShop(userId) {
  const shopSetup = document.getElementById('shop-setup');
  const shopContent = document.getElementById('shop-content');
  const shopTitle = document.getElementById('shop-title');
  const shopProducts = document.getElementById('shop-products');
  const q = query(collection(db, 'shops'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const shop = querySnapshot.docs[0].data();
    shopSetup.style.display = 'none';
    shopContent.style.display = 'block';
    shopTitle.textContent = shop.name;
    shopContent.className = shop.template;
    shopProducts.innerHTML = '';
    const productsQuery = query(collection(db, 'products'), where('shopId', '==', querySnapshot.docs[0].id));
    const productsSnapshot = await getDocs(productsQuery);
    productsSnapshot.forEach((doc) => {
      const product = doc.data();
      shopProducts.innerHTML += `
        <div class="product-card">
          <img src="${product.imageUrl}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>${product.price} €</p>
          <a href="produit.html?id=${doc.id}">Voir détails</a>
        </div>`;
    });
  }
}

// Add Product
document.getElementById('add-product-btn')?.addEventListener('click', () => {
  document.getElementById('product-form').style.display = 'block';
});

document.getElementById('product-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('product-name').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const description = document.getElementById('product-description').value;
  const category = document.getElementById('product-category').value;
  const image = document.getElementById('product-image').files[0];
  try {
    const shopQuery = query(collection(db, 'shops'), where('userId', '==', auth.currentUser.uid));
    const shopSnapshot = await getDocs(shopQuery);
    const shopId = shopSnapshot.docs[0].id;
    const storageRef = ref(storage, `products/${Date.now()}_${image.name}`);
    await uploadBytes(storageRef, image);
    const imageUrl = await getDownloadURL(storageRef);
    const docRef = await addDoc(collection(db, 'products'), {
      name,
      price,
      description,
      category,
      imageUrl,
      shopId,
      createdAt: new Date()
    });
    alert('Produit ajouté !');
    document.getElementById('product-form').reset();
    document.getElementById('product-form').style.display = 'none';
    loadShop(auth.currentUser.uid);
  } catch (error) {
    alert('Erreur : ' + error.message);
  }
});

// Load Product Details
async function loadProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  if (!productId) return;
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const product = docSnap.data();
    document.getElementById('product-image').src = product.imageUrl;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = `${product.price} €`;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-shop').textContent = `Vendu par ${product.shopId}`;
    document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(productId, product));
  }
}

// Cart Management (Client-Side)
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId, product) {
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, ...product, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Produit ajouté au panier !');
}

// Load Cart
function loadCart() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCommission = document.getElementById('cart-commission');
  if (!cartItems) return;
  cartItems.innerHTML = '';
  let total = 0;
  cart.forEach(item => {
    cartItems.innerHTML += `
      <div class="cart-item">
        <span>${item.name} (x${item.quantity})</span>
        <span>${item.price * item.quantity} €</span>
        <button onclick="removeFromCart('${item.id}')">Supprimer</button>
      </div>`;
    total += item.price * item.quantity;
  });
  cartTotal.textContent = total.toFixed(2);
  cartCommission.textContent = (total * 0.05).toFixed(2);
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCart();
}

// Initialize Page
if (document.getElementById('product-list')) {
  loadProducts();
  loadShops();
}
if (document.getElementById('cart-items')) loadCart();
if (window.location.pathname.includes('produit.html')) loadProductDetails();