'use client';

import React, { useMemo } from 'react';
import { generateDecorItems } from '../../utils/passDecorArt';

interface PassDecorationsProps {
  /** Props on the ground layer (1.0x parallax). */
  layer: 'ground' | 'trees';
}

const GROUND_ITEMS = generateDecorItems(42, 145, 120);
const TREE_ITEMS = generateDecorItems(28, 195, 80);

const PassDecorations: React.FC<PassDecorationsProps> = ({ layer }) => {
  const items = useMemo(() => (layer === 'ground' ? GROUND_ITEMS : TREE_ITEMS), [layer]);

  return (
    <>
      {items.map((item, i) => (
        <div
          key={`${layer}-${i}`}
          className={`pass-decor pass-decor-${layer}`}
          style={{
            left: item.scrollX,
            opacity: item.opacity,
            transform: `translateX(-50%) scale(${item.scale})`,
          }}
          aria-hidden
        >
          <svg
            width={item.width}
            height={item.height}
            viewBox={item.viewBox}
            dangerouslySetInnerHTML={{ __html: item.innerHtml }}
          />
        </div>
      ))}
    </>
  );
};

export default PassDecorations;
