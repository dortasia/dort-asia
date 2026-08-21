import React from 'react';

export function JsonLd<T extends Record<string, any>>({ data }: { data: T | T[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
