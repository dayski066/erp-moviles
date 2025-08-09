import React from 'react';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

export interface User {
  nombre: string;
  apellidos: string;
  rol: string;
  establecimiento: string;
  avatar: string;
}

// Props del Layout
export interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  user: User;
}