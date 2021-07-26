import express from 'express';

export function universal(): void {
  const port = process.env.PORT || 4000;
  const server = express();

  server.get('*', (request, response) => {
    response.send(`
      <html>
        <head>
          <title>${request.url}</title>
        </head>
        <body>
          <h1>Not Implemented!</h1>
        </body>
      </html>
    `);
  });

  server.listen(port, () => {
    console.log(`Listening on http://0.0.0.0:${port}`);
  });
}
