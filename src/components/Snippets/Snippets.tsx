import clsx from 'clsx';
import Fuse from 'fuse.js';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import type { Snippet } from '../../../utils';
import snippets from '../../configModules/snippets';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import SearchField from './SearchField/SearchField';

import * as styles from './Snippets.css';

type HighlightIndex = number | null;
type ReturnedSnippet = Snippet | null;
interface Props {
  isOpen: boolean;
  onHighlight?: (snippet: ReturnedSnippet) => void;
  onClose?: (snippet: ReturnedSnippet) => void;
}

const getLabel = (snippet: Snippet) => `${snippet.group}\n${snippet.name}`;

function getSnippetId(snippet: Snippet, index: number) {
  return `${snippet.group}_${snippet.name}_${index}`;
}

const fuse = new Fuse(snippets, {
  threshold: 0.3,
  keys: [
    {
      name: 'group',
      weight: 2,
    },
    {
      name: 'name',
      weight: 1,
    },
  ],
});

export default ({ isOpen, onHighlight, onClose }: Props) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedIndex, setHighlightedIndex] =
    useState<HighlightIndex>(null);

  const listEl = useRef<HTMLUListElement | null>(null);
  const highlightedEl = useRef<HTMLLIElement | null>(null);

  const filteredSnippets = useMemo(
    () =>
      searchTerm
        ? fuse.search(searchTerm).map((result) => result.item)
        : snippets,
    [searchTerm]
  );

  const closeHandler = (returnValue: ReturnedSnippet) => {
    if (typeof onClose === 'function') {
      onClose(returnValue);
    }
  };

  const debouncedPreview = useDebouncedCallback(
    (previewSnippet: ReturnedSnippet) => {
      if (typeof onHighlight === 'function') {
        onHighlight(previewSnippet);
      }
    },
    50
  );

  if (
    typeof highlightedIndex === 'number' &&
    filteredSnippets[highlightedIndex]
  ) {
    const highlightedItem = document.getElementById(
      getSnippetId(filteredSnippets[highlightedIndex], highlightedIndex)
    );

    highlightedItem?.scrollIntoView({ block: 'nearest' });
  }

  useEffect(() => {
    debouncedPreview(
      typeof highlightedIndex === 'number'
        ? filteredSnippets[highlightedIndex]
        : null
    );
  }, [debouncedPreview, filteredSnippets, highlightedIndex]);

  return (
    <div className={styles.root}>
      <div className={styles.fieldContainer}>
        <SearchField
          value={searchTerm}
          onChange={(e) => {
            const { value } = e.currentTarget;
            setSearchTerm(value);
          }}
          placeholder="Find a snippet..."
          aria-label="Search snippets"
          onBlur={() => {
            setHighlightedIndex(null);
          }}
          onKeyDown={(event) => {
            if (/^(?:Arrow)?Down$/.test(event.key)) {
              if (
                highlightedIndex === null ||
                highlightedIndex === filteredSnippets.length - 1
              ) {
                setHighlightedIndex(0);
              } else if (highlightedIndex < filteredSnippets.length - 1) {
                setHighlightedIndex(highlightedIndex + 1);
              }
              event.preventDefault();
            } else if (/^(?:Arrow)?Up$/.test(event.key)) {
              if (highlightedIndex === null || highlightedIndex === 0) {
                setHighlightedIndex(filteredSnippets.length - 1);
              } else if (highlightedIndex > 0) {
                setHighlightedIndex(highlightedIndex - 1);
              }
              event.preventDefault();
            } else if (
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              /^[a-z0-9!"#$%&'()*+,.\/:;<=>?@\[\] ^_`{|}~-]$/i.test(event.key)
            ) {
              // reset index when character typed in field
              setHighlightedIndex(0);
            } else if (event.key === 'Enter' && highlightedIndex !== null) {
              closeHandler(filteredSnippets[highlightedIndex]);
            } else if (event.key === 'Escape') {
              closeHandler(null);
            }
          }}
        />
      </div>
      <ul
        className={styles.snippetsContainer}
        ref={listEl}
        aria-label="Filtered snippets"
      >
        {filteredSnippets.map((snippet, index) => {
          const isHighlighted = highlightedIndex === index;

          return (
            <li
              ref={isHighlighted ? highlightedEl : undefined}
              id={getSnippetId(snippet, index)}
              key={`${snippet.group}_${snippet.name}_${index}`}
              className={clsx(styles.snippet, {
                [styles.highlight]: isHighlighted,
              })}
              onMouseMove={
                isOpen && !isHighlighted
                  ? () => {
                      setHighlightedIndex(index);
                    }
                  : undefined
              }
              onMouseDown={() => closeHandler(filteredSnippets[index])}
              title={getLabel(snippet)}
            >
              <Stack space="none">
                <Text size="large" weight="strong">
                  {snippet.group}
                </Text>
                <Text size="large" tone="secondary">
                  {snippet.name}
                </Text>
              </Stack>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
