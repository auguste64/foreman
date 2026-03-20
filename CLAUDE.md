
## Règle : sections visibles sur fond aurora

Le fond aurora (blobs orange/rouge/violet animés) est rendu via un div `position: fixed` dans le layout. Toute section avec un fond sombre (#111110, #1a1917, #2A2A27, etc.) devient **invisible** car elle se fond dans le gradient.

**Fix obligatoire** : toute section qui doit être visible sur le fond aurora doit avoir `position: 'relative'` et `zIndex: 2` dans son style inline.
```tsx
<section style={{
  background: '#0a0a09',
  position: 'relative',
  zIndex: 2
}}>
```

Ne jamais essayer de corriger ce problème en changeant uniquement la couleur de fond. Le z-index est la seule solution.

## Chrome / Navigateur

- Ne JAMAIS utiliser `createIfEmpty: true` dans tabs_context_mcp — cela ouvre une nouvelle fenêtre Chrome.
- Si aucun groupe MCP n'existe, demander à Auguste d'ouvrir l'extension Claude dans son Chrome existant.
- Toujours appeler tabs_context_mcp SANS paramètres d'abord pour vérifier l'existant.
