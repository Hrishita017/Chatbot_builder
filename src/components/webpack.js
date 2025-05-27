module.exports = {
  // ... existing webpack config
  entry: {
    app: './src/index.js', // Your main app entry point
    widget: './src/widget.jsx', // New entry point for the widget
  },
  output: {
    // ... existing output
    filename: '[name].bundle.js', // Will generate app.bundle.js and widget.bundle.js
    library: 'MyChatbotWidget', // Make the widget bundle globally accessible
    libraryTarget: 'window',    // Attach it to the window object
    // For widget, you might want to specify a different path or keep it in dist
  },
  // ... other rules (babel-loader for JSX, css-loader for CSS, etc.)
  // Make sure your CSS is bundled with the widget if it's external.
  // For ChatbotPreview.css, you'll need to ensure it's imported in widget.jsx
  // and handled by your CSS loader (e.g., style-loader, css-loader)
};