import path from 'node:path';

const layerRules = {
  domain: {
    forbidden: ['src/app/', 'src/infra/'],
    message: 'Domain layer cannot import from Application or Infrastructure layers.',
  },
  app: {
    forbidden: ['src/infra/'],
    message: 'Application layer cannot import from Infrastructure layer.',
  },
};

function getLayer(filename) {
  if (filename.includes('/src/domain/')) return 'domain';
  if (filename.includes('/src/app/')) return 'app';
  if (filename.includes('/src/infra/')) return 'infra';
  return null;
}

const dddLayerRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce DDD layer dependency rules',
    },
    messages: {
      forbiddenImport: '{{message}} (importing "{{source}}" from {{layer}} layer)',
    },
  },
  create(context) {
    const filename = context.filename;
    const layer = getLayer(filename);

    if (!layer || !layerRules[layer]) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        for (const forbidden of layerRules[layer].forbidden) {
          if (source.includes(forbidden) || resolveRelative(filename, source, forbidden)) {
            context.report({
              node,
              messageId: 'forbiddenImport',
              data: {
                message: layerRules[layer].message,
                source,
                layer,
              },
            });
          }
        }
      },
    };
  },
};

function resolveRelative(filename, source, forbidden) {
  if (!source.startsWith('.')) return false;

  try {
    const dir = path.dirname(filename);
    const resolved = path.resolve(dir, source);
    return resolved.includes(forbidden.replace('src/', '/src/'));
  } catch {
    return false;
  }
}

export default {
  rules: {
    'layer-imports': dddLayerRule,
  },
};
