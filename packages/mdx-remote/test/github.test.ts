import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getGitHubFiles, getLocalFiles } from '@/github';
import * as blog from '@/github/api/fetch-blob';
import * as tree from '@/github/api/fetch-tree';

const cwd = path.dirname(fileURLToPath(import.meta.url));

describe('Get Files', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('Local Files', async () => {
    const files = await getLocalFiles({
      directory: path.resolve(cwd, './fixtures'),
    });

    expect(files).toContainEqual({
      data: {
        data: {
          resolver: {
            file: path.resolve(cwd, './fixtures/another/file.mdx'),
            type: 'local',
          },
        },
        description: 'You found me!',
        title: 'Another File',
      },
      path: 'another/file.mdx',
      type: 'page',
    });
    expect(files).toContainEqual({
      data: {
        data: {
          resolver: {
            file: path.resolve(cwd, './fixtures/index.mdx'),
            type: 'local',
          },
        },
        description: 'Something',
        title: 'Hello World',
      },
      path: 'index.mdx',
      type: 'page',
    });

    expect(files).toContainEqual({
      type: 'meta',
      path: 'meta.json',
      data: {
        pages: ['index', '---Nothing---', '...another'],
      },
    });
  });

  test('Local Files with `keepContent`', async () => {
    const files = await getLocalFiles({
      directory: path.resolve(cwd, './fixtures'),
      keepContent: true,
    });

    for (const file of files) {
      if (file.type === 'page') expect(file.data.data.content).toBeDefined();
    }
  });

  test('Remote Files', async () => {
    vi.spyOn(tree, 'fetchTree').mockImplementation(() => {
      return Promise.resolve({
        sha: 'main',
        url: '...',
        truncated: false,
        tree: [
          {
            type: 'blob',
            sha: '1',
            url: '1',
            path: 'content/index.mdx',
          },
          {
            type: 'blob',
            sha: '3',
            url: '3',
            path: 'content/test.mdx',
          },
          {
            type: 'blob',
            sha: '2',
            url: '2',
            path: 'outside.mdx',
          },
        ],
      });
    });

    vi.spyOn(blog, 'fetchBlob').mockImplementation(() => {
      return Promise.resolve({
        encoding: 'utf8',
        content: `
        ---
        title: Hello World
        ---
        
        # Hey
        `,
      });
    });

    const files = await getGitHubFiles({
      directory: './content',
      owner: 'owner',
      repo: 'repo',
      accessToken: 'token',
    });

    await expect(files).toMatchFileSnapshot(
      path.resolve(cwd, './out/github-files.json5'),
    );
  });
});
