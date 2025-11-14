export interface BaseLayoutProps {
  content: string;
}

export function BaseLayout({ content }: BaseLayoutProps): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #282e59;
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
          background-color: #ffffff;
        }
        .content h2 {
          color: #282e59;
          margin-top: 0;
          font-size: 24px;
        }
        .content p {
          margin: 16px 0;
          font-size: 16px;
          color: #555;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 14px;
          background-color: #f9f9f9;
          border-top: 1px solid #eee;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
      </div>
    </body>
    </html>
  `;
}
