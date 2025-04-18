// Simple local web server for testing
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  // Handle root path
  let filePath = req.url === '/' 
    ? './index.html' 
    : '.' + req.url;
    
  // Handle directory requests (enable directory listing)
  if (filePath.endsWith('/')) {
    const dirPath = filePath.slice(0, -1);
    
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      try {
        const files = fs.readdirSync(dirPath);
        
        let html = '<html><head><title>Directory Listing</title></head><body>';
        html += `<h1>Directory: ${dirPath}</h1><ul>`;
        
        // Add parent directory link
        if (dirPath !== '.') {
          html += `<li><a href="${path.dirname(dirPath.replace('.', ''))}/">../</a></li>`;
        }
        
        // Add files
        files.forEach(file => {
          const fullPath = path.join(dirPath, file);
          const isDir = fs.statSync(fullPath).isDirectory();
          html += `<li><a href="${path.join(req.url, file)}${isDir ? '/' : ''}">${file}${isDir ? '/' : ''}</a></li>`;
        });
        
        html += '</ul></body></html>';
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      } catch (err) {
        res.writeHead(500);
        res.end('500 Server Error');
        return;
      }
    }
  }
  
  // Special handling for Excel files
  if (filePath.endsWith('.xlsx')) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      
      // Set proper headers
      res.writeHead(200, { 
        'Content-Type': MIME_TYPES['.xlsx'],
        'Content-Length': stats.size,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      
      // Stream the file instead of reading it all at once
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      
      return;
    }
  }
    
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try to look in pages directory for html files without the pages/ prefix
        if (extname === '.html' && !filePath.includes('/pages/')) {
          const pagesPath = './pages' + req.url;
          
          fs.readFile(pagesPath, (err2, content2) => {
            if (err2) {
              res.writeHead(404);
              res.end('404 Not Found');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content2, 'utf-8');
          });
          return;
        }
        
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
      return;
    }
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});

// Check if required files exist
function checkRequiredFiles() {
  // Check for website_data.xlsx
  const dataFile = path.join(__dirname, 'data', 'website_data.xlsx');
  if (!fs.existsSync(dataFile)) {
    console.log("Warning: website_data.xlsx not found in data/ directory");
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`People page: http://localhost:${PORT}/pages/people.html`);
  console.log(`Press Ctrl+C to stop the server`);
  
  // Check for required files
  checkRequiredFiles();
}); 