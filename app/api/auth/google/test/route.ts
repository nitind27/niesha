import { NextRequest, NextResponse } from "next/server"

// Test endpoint to show exact redirect URI and help user configure Google Console
export async function GET(request: NextRequest) {
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
  const origin = request.nextUrl.origin
  
  // Get redirect URI the same way as the actual OAuth route
  const redirectUri = envUrl 
    ? `${envUrl}/api/auth/google/callback`
    : `${origin}/api/auth/google/callback`

  // Remove trailing slash if any
  const cleanRedirectUri = redirectUri.replace(/\/$/, "")

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Google OAuth Configuration Helper</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .card {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1a73e8;
          margin-top: 0;
        }
        .uri-box {
          background: #f8f9fa;
          border: 2px solid #1a73e8;
          border-radius: 4px;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
          color: #1a73e8;
          font-weight: bold;
        }
        .copy-btn {
          background: #1a73e8;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 10px;
        }
        .copy-btn:hover {
          background: #1557b0;
        }
        .steps {
          background: #e8f0fe;
          border-left: 4px solid #1a73e8;
          padding: 15px;
          margin: 20px 0;
        }
        .steps ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 8px 0;
        }
        .warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
        }
        .success {
          background: #d4edda;
          border-left: 4px solid #28a745;
          padding: 15px;
          margin: 20px 0;
        }
        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🔧 Google OAuth Configuration Helper</h1>
        
        <div class="success">
          <strong>✅ Exact Redirect URI:</strong>
          <div class="uri-box" id="redirectUri">${cleanRedirectUri}</div>
          <button class="copy-btn" onclick="copyToClipboard()">📋 Copy URI</button>
        </div>

        <div class="warning">
          <strong>⚠️ Important:</strong> Copy the URI above EXACTLY as shown. 
          It must match character-for-character in Google Console (including http/https, no trailing slash).
        </div>

        <div class="steps">
          <h2>📝 Step-by-Step Instructions:</h2>
          <ol>
            <li>Click the <strong>"Copy URI"</strong> button above</li>
            <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console → Credentials</a></li>
            <li>Click on your <strong>OAuth 2.0 Client ID</strong></li>
            <li>Scroll down to <strong>"Authorized redirect URIs"</strong></li>
            <li>Click <strong>"ADD URI"</strong></li>
            <li>Paste the copied URI (make sure it matches EXACTLY)</li>
            <li>Click <strong>"SAVE"</strong></li>
            <li>Wait <strong>2-3 minutes</strong> for changes to propagate</li>
            <li>Try logging in again</li>
          </ol>
        </div>

        <div class="steps">
          <h2>🔍 Current Configuration:</h2>
          <ul>
            <li><strong>Environment URL:</strong> <code>${envUrl || "Not set (using request origin)"}</code></li>
            <li><strong>Request Origin:</strong> <code>${origin}</code></li>
            <li><strong>Google Client ID:</strong> <code>${process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set"}</code></li>
            <li><strong>Google Client Secret:</strong> <code>${process.env.GOOGLE_CLIENT_SECRET ? "✅ Set" : "❌ Not set"}</code></li>
          </ul>
        </div>

        <div class="steps">
          <h2>💡 Common Issues:</h2>
          <ul>
            <li><strong>Trailing Slash:</strong> Make sure there's NO trailing slash at the end</li>
            <li><strong>Protocol:</strong> Use <code>http://</code> for localhost, <code>https://</code> for production</li>
            <li><strong>Port Number:</strong> Include port number for localhost (e.g., <code>:3000</code>)</li>
            <li><strong>Case Sensitivity:</strong> URIs are case-sensitive</li>
            <li><strong>Propagation Time:</strong> Changes can take 2-3 minutes to take effect</li>
          </ul>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="/login" style="color: #1a73e8; text-decoration: none;">← Back to Login</a>
        </div>
      </div>

      <script>
        function copyToClipboard() {
          const uri = document.getElementById('redirectUri').textContent;
          navigator.clipboard.writeText(uri).then(() => {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            btn.style.background = '#28a745';
            setTimeout(() => {
              btn.textContent = originalText;
              btn.style.background = '#1a73e8';
            }, 2000);
          });
        }
      </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  })
}

