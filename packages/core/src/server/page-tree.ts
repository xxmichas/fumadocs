import type { ReactElement, ReactNode } from 'react';

export interface Root {
  name: ReactNode;
  children: Node[];
}

export type Node = Item | Separator | Folder;

export interface Item {
  type: 'page';
  name: ReactNode;
  url: string;
  external?: boolean;
  icon?: ReactElement;

  $ref?: {
    file: string;
  };
}

export interface Separator {
  type: 'separator';
  name: ReactNode;
}

export interface Folder {
  /**
   * Optional id to be attached to folders
   *
   * @deprecated use `$ref`
   */
  id?: string;

  $ref?: {
    metaFile?: string;
  };

  type: 'folder';
  name: ReactNode;
  root?: boolean;
  defaultOpen?: boolean;
  index?: Item;
  icon?: ReactElement;
  children: Node[];
}
