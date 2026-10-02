import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Configuración principal de Docusaurus para ULYTICS
const config: Config = {
  title: 'Documentación ULYTICS',
  tagline: 'Plataforma de reportería de indicadores de Progresión Académica y Curricular',
  favicon: 'img/logo2_ULYTICS.jpeg',

  future: {
    v4: true,
  },
  markdown: {
    mermaid: true,
  },

  // 2. Cargar el tema de Mermaid
  themes: ['@docusaurus/theme-mermaid'],
  
  // Ajusta estas URLs cuando vayas a desplegar la documentación en producción
  url: 'https://ulytics.uach.cl', 
  baseUrl: '/',

  // Configuración para despliegue en GitHub Pages (ajusta según tu repo)
  organizationName: 'uach', 
  projectName: 'ulytics', 

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Configuración de idioma al español
  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Descomenta y ajusta esta línea si quieres que los devs puedan editar en GitHub
          // editUrl: 'https://github.com/tu-usuario/ulytics/tree/main/docs/',
        },
        // Desactivamos el blog ya que es documentación estrictamente técnica
        blog: false, 
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo_ULYTICS.jpeg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ULYTICS',
      logo: {
        alt: 'Logo ULYTICS',
        src: 'img/logo_ULYTICS.jpeg', // Logo principal en la barra de navegación
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentación Técnica',
        },
        {
          href: 'https://github.com/CorsacCh/ulytics', // Pon aquí el link real de tu repo
          label: 'Repositorio GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      logo: {
        alt: 'Logo Institucional UACh',
        src: 'img/logo_UACh.svg', // Logo de la universidad en el footer
        href: 'https://www.uach.cl/',
        width: 160,
      },
      links: [
        {
          title: 'Arquitectura',
          items: [
            {
              label: 'Diagrama de Componentes (C4)',
              to: '/docs/arquitectura',
            },
          ],
        },
        {
          title: 'Flujos de Secuencia',
          items: [
            {
              label: 'Inicio de Sesión',
              to: '/docs/flujos/inicio-sesion',
            },
            {
              label: 'Carga de Datos (US-ADM-03)',
              to: '/docs/flujos/carga-datos',
            },
          ],
        },
        {
          title: 'Código Fuente',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/CorsacCh/ulytics',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ULYTICS - Universidad Austral de Chile. Construido con Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;