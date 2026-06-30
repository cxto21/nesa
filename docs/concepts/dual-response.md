# Dual Response

**Dual response** is the core pattern of Bugeisha: same route, different output for agents vs humans.

## The pattern

```ts
router.get('/products', (request) => {
  if (request.agentType === 'ai') {
    // Machine-readable response
    return Response.json({
      products: [...],
      count: 42,
      filters: { category: 'all', sort: 'price' },
    });
  }

  // Human-readable response
  return new Response(`
    <html>
      <head><title>Products</title></head>
      <body>
        <h1>Products</h1>
        <div class="grid">
          ${products.map(p => `
            <div class="card">
              <h2>${p.name}</h2>
              <p>${p.price}</p>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `);
});
```

## Response formats

### Agent response (JSON)

```json
{
  "products": [
    { "id": 1, "name": "Widget", "price": 9.99 },
    { "id": 2, "name": "Gadget", "price": 19.99 }
  ],
  "count": 2,
  "metadata": {
    "source": "api",
    "version": "1.0"
  }
}
```

### Human response (HTML)

```html
<html>
  <body>
    <h1>Products</h1>
    <div class="grid">
      <div class="card">
        <h2>Widget</h2>
        <p>$9.99</p>
      </div>
      <div class="card">
        <h2>Gadget</h2>
        <p>$19.99</p>
      </div>
    </div>
  </body>
</html>
```

## Headers

Agent responses include special headers:

```ts
return Response.json(data, {
  headers: {
    'Content-Type': 'application/json',
    'X-Agent-Optimized': 'true',  // Machine-readable flag
  },
});
```

## Best practices

!!! info "Do"

    - Return **structured JSON** for agents (include metadata, counts, filters)
    - Return **clean HTML** for humans (semantic, accessible)
    - Include **helpful headers** (`X-Agent-Optimized`)
    - Keep **consistent data** between both responses

!!! warning "Don't"

    - Return **different data** for agents vs humans (same content, different format)
    - Return **raw JSON** to humans (poor UX)
    - Return **unstructured text** to agents (hard to parse)

## Helper function

For complex handlers, extract the logic:

```ts
async function getProducts(env: Env) {
  const products = await env.DB.prepare('SELECT * FROM products').all();
  return products;
}

router.get('/products', async (request, env) => {
  const products = await getProducts(env);

  if (request.agentType === 'ai') {
    return Response.json({ products, count: products.length });
  }

  return new Response(renderProductsHTML(products));
});
```

## Real-world example

```ts
// Search endpoint
router.get('/search', async (request, env) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const results = await search(env, query);

  if (request.agentType === 'ai') {
    return Response.json({
      query,
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        score: r.score,
      })),
      total: results.length,
    });
  }

  return new Response(renderSearchHTML(query, results));
});
```
