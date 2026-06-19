const express = require("express")
const app = express()
const PORT = 3000
// 1. Your original Home Route
app.get('/', (req, res) => {
  res.send('Hello, World! My Express server is running.');
});

// 2. NEW: The About Route
app.get('/about', (req, res) => {
  res.send('Welcome to the About page! I am learning Express.');
});

// 3. NEW: Sending JSON Data
// JSON is a format used to send data across the internet
app.get('/api/user', (req, res) => {
  res.json({ 
    name: "Alex", 
    role: "Beginner Developer", 
    status: "Doing great!" 
  });
});

app.get('/users/:name', (req, res) => {
  
  // We can grab that variable from the "request" (req) object
  const userName = req.params.name;
  
  // Send back a custom greeting
  res.send(`Hello there, ${userName}! Welcome to your custom page.`);
});

app.get('/search', (req, res) => {
  
  // We grab query parameters using req.query instead of req.params
  const item = req.query.keyword;

  console.log(req.query,">>>>>>>>ITEMMMM");
  
  // Check if the user actually typed a keyword
  if (item) {
    res.send(`You searched for: ${item}. Here are your results!`);
  } else {
    res.send('Please provide a keyword to search for. (Example: /search?keyword=apple)');
  }
});

// 5. Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
console.log("HEllo")