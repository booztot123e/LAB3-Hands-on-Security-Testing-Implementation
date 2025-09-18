// frontend/script.js
const API_BASE = 'http://localhost:3000';

let currentUser = null;

// Login functionality
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('login-result');
        
        if (data.success) {
            currentUser = data.user;
            resultDiv.innerHTML = `
                <div class="success">
                    <h4>Login Successful!</h4>
                    <p><strong>User:</strong> ${data.user.username}</p>
                    <p><strong>Email:</strong> ${data.user.email}</p>
                    <p><strong>Role:</strong> ${data.user.role}</p>
                </div>
            `;
            
            // Show profile section and user info
            document.getElementById('profile-section').style.display = 'block';
            document.getElementById('user-info').style.display = 'block';
            document.getElementById('current-user-id').textContent = data.user.id;
            document.getElementById('current-user-id-hidden').value = data.user.id;
            
            loadComments();
        } else {
            resultDiv.innerHTML = `<div class="error">${data.message}</div>`;
        }
    } catch (error) {
        document.getElementById('login-result').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
});

// Fetch user profile (IDOR vulnerability)
async function fetchUserProfile() {
    const userId = document.getElementById('user-id-input').value;
    
    if (!userId) {
        alert('Please enter a user ID');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user/${userId}`);
        const data = await response.json();
        
        const resultDiv = document.getElementById('profile-result');
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="success">
                    <h4>User Profile:</h4>
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Username:</strong> ${data.username}</p>
                    <p><strong>Email:</strong> ${data.email}</p>
                    <p><strong>Password:</strong> ${data.password}</p>
                    <p><strong>Role:</strong> ${data.role}</p>
                    <p><strong>Created:</strong> ${new Date(data.created_at).toLocaleDateString()}</p>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div class="error">${data.error}</div>`;
        }
    } catch (error) {
        document.getElementById('profile-result').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// Add comment (XSS vulnerability)
document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const content = document.getElementById('comment-content').value;
    const userId = document.getElementById('current-user-id-hidden').value;
    
    try {
        const response = await fetch(`${API_BASE}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, content })
        });
        
        if (response.ok) {
            document.getElementById('comment-content').value = '';
            loadComments();
        }
    } catch (error) {
        console.error('Error adding comment:', error);
    }
});

// Load and display comments (XSS vulnerability)
async function loadComments() {
    try {
        const response = await fetch(`${API_BASE}/comments`);
        const comments = await response.json();
        
        const displayDiv = document.getElementById('comments-display');
        
        if (comments.length > 0) {
            displayDiv.innerHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-author">${comment.username}</div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-date">${new Date(comment.created_at).toLocaleString()}</div>
                </div>
            `).join('');
        } else {
            displayDiv.innerHTML = '<p>No comments yet.</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
    }
}

// Search products (SQL Injection vulnerability)
async function searchProducts() {
    const query = document.getElementById('search-input').value;
    
    if (!query.trim()) {
        alert('Please enter search term');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        const resultDiv = document.getElementById('search-results');
        
        if (Array.isArray(data) && data.length > 0) {
            resultDiv.innerHTML = `
                <h4>Search Results:</h4>
                ${data.map(item => `
                    <div class="comment">
                        <strong>${item.name || item.username || 'Item'}</strong><br>
                        ${item.price ? `Price: $${item.price}` : ''}
                        ${item.email ? `Email: ${item.email}` : ''}
                        ${item.password ? `Password: ${item.password}` : ''}
                        ${item.description ? `<br>Description: ${item.description}` : ''}
                    </div>
                `).join('')}
            `;
        } else if (data.error) {
            resultDiv.innerHTML = `<div class="error">Error: ${data.error}</div>`;
        } else {
            resultDiv.innerHTML = '<p>No results found.</p>';
        }
    } catch (error) {
        document.getElementById('search-results').innerHTML = 
            `<div class="error">Error: ${error.message}</div>`;
    }
}

// Load comments on page load
document.addEventListener('DOMContentLoaded', () => {
    loadComments();
});