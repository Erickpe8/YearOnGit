import type { StaticLocale } from "@/lib/i18n/supported-locales";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export const legalContent: Record<
  StaticLocale,
  { privacy: LegalDocument; terms: LegalDocument }
> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      updated: "Last updated: July 27, 2026",
      intro:
        "YearOnGit helps you explore a year-in-review of your GitHub activity, including public and private repositories you can access. This policy explains what we access, what we store, and what we do not do with your data.",
      sections: [
        {
          title: "What we access",
          paragraphs: [
            "When you sign in with GitHub, we request permission to read your profile and repository activity, including private repositories you have access to. We use the GitHub API to generate your Wrapped stats, such as commits, contributions, languages, and streaks.",
          ],
          bullets: [
            "Profile information (username, avatar, display name)",
            "Contribution activity for the selected year",
            "Repository metadata needed to build your recap",
          ],
        },
        {
          title: "What we do not access",
          paragraphs: [
            "We do not ask for your GitHub password. We only read data needed for your recap and do not modify your repositories.",
          ],
          bullets: [
            "No passwords or credentials beyond the OAuth token",
            "No unrelated account data outside what is needed for your recap",
            "No writing to your repositories or changing account settings",
          ],
        },
        {
          title: "How we use your data",
          paragraphs: [
            "Your data is used only to generate and display your Wrapped experience. OAuth tokens stay on the server and are never exposed to the browser.",
          ],
          bullets: [
            "Generate your personalized year-in-review",
            "Show stats inside the YearOnGit interface",
            "Improve reliability and performance of the service",
          ],
        },
        {
          title: "Storage and retention",
          paragraphs: [
            "We may store your language preference locally in your browser. Session-related data is kept only as long as needed to provide the service. We do not sell your personal data.",
          ],
        },
        {
          title: "Third parties",
          paragraphs: [
            "YearOnGit relies on GitHub for authentication and activity data. GitHub processes your information under its own privacy policy. Translation features may use third-party services to localize the interface.",
          ],
        },
        {
          title: "Your choices",
          paragraphs: [
            "You can stop using YearOnGit at any time. You can also revoke YearOnGit's access from your GitHub account settings under Applications.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "If you have questions about this policy, contact the project maintainer at github.com/Erickpe8.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updated: "Last updated: July 27, 2026",
      intro:
        "By using YearOnGit, you agree to these terms. Please read them before continuing with GitHub sign-in or using the Wrapped experience.",
      sections: [
        {
          title: "About the service",
          paragraphs: [
            "YearOnGit is an independent project that presents a Spotify Wrapped-style recap of your GitHub activity. It is not affiliated with, endorsed by, or sponsored by GitHub, Inc.",
          ],
        },
        {
          title: "Eligibility",
          paragraphs: [
            "You must have a valid GitHub account and comply with GitHub's Terms of Service and Acceptable Use policies while using YearOnGit.",
          ],
        },
        {
          title: "Demo and preview content",
          paragraphs: [
            "Some screens may show sample or randomized preview data before real GitHub data is connected. Final stats are based on the information available through the permissions you grant.",
          ],
        },
        {
          title: "Acceptable use",
          paragraphs: [
            "You agree not to misuse the service, attempt unauthorized access, interfere with normal operation, or use YearOnGit for unlawful purposes.",
          ],
          bullets: [
            "Do not abuse API limits or automated scraping of the site",
            "Do not misrepresent generated stats as official GitHub products",
            "Do not attempt to access other users' data without authorization",
          ],
        },
        {
          title: "Disclaimer",
          paragraphs: [
            "YearOnGit is provided as is and as available. We do not guarantee uninterrupted access, perfect accuracy of every stat, or that the service will always remain available.",
          ],
        },
        {
          title: "Changes",
          paragraphs: [
            "We may update these terms or the product experience over time. Continued use of YearOnGit after changes are published means you accept the updated terms.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            "Questions about these terms can be sent to the project maintainer at github.com/Erickpe8.",
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Política de privacidad",
      updated: "Última actualización: 27 de julio de 2026",
      intro:
        "YearOnGit te ayuda a explorar un resumen anual de tu actividad en GitHub, incluidos repositorios públicos y privados a los que tienes acceso. Esta política explica qué accedemos, qué guardamos y qué no hacemos con tus datos.",
      sections: [
        {
          title: "Qué accedemos",
          paragraphs: [
            "Cuando inicias sesión con GitHub, pedimos permiso para leer tu perfil y la actividad de tus repositorios, incluidos los privados a los que tienes acceso. Usamos la API de GitHub para generar tus estadísticas del Wrapped, como commits, contribuciones, lenguajes y rachas.",
          ],
          bullets: [
            "Información del perfil (usuario, avatar, nombre visible)",
            "Actividad de contribuciones del año seleccionado",
            "Metadatos de repositorios necesarios para tu recap",
          ],
        },
        {
          title: "Qué no accedemos",
          paragraphs: [
            "No pedimos tu contraseña de GitHub. Solo leemos los datos necesarios para tu recap y no modificamos tus repositorios.",
          ],
          bullets: [
            "Sin contraseñas ni credenciales más allá del token OAuth",
            "Sin datos de la cuenta que no sean necesarios para tu recap",
            "Sin escribir en tus repositorios ni cambiar la configuración de tu cuenta",
          ],
        },
        {
          title: "Cómo usamos tus datos",
          paragraphs: [
            "Tus datos se usan solo para generar y mostrar tu experiencia Wrapped. Los tokens OAuth permanecen en el servidor y nunca se exponen al navegador.",
          ],
          bullets: [
            "Generar tu resumen personalizado del año",
            "Mostrar estadísticas dentro de YearOnGit",
            "Mejorar la fiabilidad y el rendimiento del servicio",
          ],
        },
        {
          title: "Almacenamiento y retención",
          paragraphs: [
            "Podemos guardar tu preferencia de idioma localmente en el navegador. Los datos de sesión se conservan solo el tiempo necesario para prestar el servicio. No vendemos tus datos personales.",
          ],
        },
        {
          title: "Terceros",
          paragraphs: [
            "YearOnGit depende de GitHub para autenticación y datos de actividad. GitHub procesa tu información bajo su propia política de privacidad. Las funciones de traducción pueden usar servicios de terceros para localizar la interfaz.",
          ],
        },
        {
          title: "Tus opciones",
          paragraphs: [
            "Puedes dejar de usar YearOnGit en cualquier momento. También puedes revocar el acceso de YearOnGit desde la configuración de tu cuenta de GitHub, en Aplicaciones.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            "Si tienes preguntas sobre esta política, contacta al mantenedor del proyecto en github.com/Erickpe8.",
          ],
        },
      ],
    },
    terms: {
      title: "Términos de servicio",
      updated: "Última actualización: 27 de julio de 2026",
      intro:
        "Al usar YearOnGit, aceptas estos términos. Léelos antes de continuar con el inicio de sesión de GitHub o de usar la experiencia Wrapped.",
      sections: [
        {
          title: "Sobre el servicio",
          paragraphs: [
            "YearOnGit es un proyecto independiente que presenta un recap estilo Spotify Wrapped de tu actividad en GitHub. No está afiliado, respaldado ni patrocinado por GitHub, Inc.",
          ],
        },
        {
          title: "Elegibilidad",
          paragraphs: [
            "Debes tener una cuenta válida de GitHub y cumplir los Términos de Servicio y las políticas de uso aceptable de GitHub mientras usas YearOnGit.",
          ],
        },
        {
          title: "Demo y contenido de vista previa",
          paragraphs: [
            "Algunas pantallas pueden mostrar datos de ejemplo o aleatorios antes de conectar datos reales de GitHub. Las estadísticas finales se basan en la información disponible según los permisos que otorgues.",
          ],
        },
        {
          title: "Uso aceptable",
          paragraphs: [
            "Aceptas no hacer un uso indebido del servicio, intentar accesos no autorizados, interferir con su funcionamiento normal ni usar YearOnGit con fines ilegales.",
          ],
          bullets: [
            "No abusar de límites de API ni automatizar scraping del sitio",
            "No presentar estadísticas generadas como productos oficiales de GitHub",
            "No intentar acceder a datos de otros usuarios sin autorización",
          ],
        },
        {
          title: "Descargo de responsabilidad",
          paragraphs: [
            "YearOnGit se ofrece tal cual y según disponibilidad. No garantizamos acceso ininterrumpido, exactitud perfecta de cada estadística ni que el servicio permanezca siempre disponible.",
          ],
        },
        {
          title: "Cambios",
          paragraphs: [
            "Podemos actualizar estos términos o la experiencia del producto con el tiempo. El uso continuado de YearOnGit después de publicar cambios implica que aceptas los términos actualizados.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            "Las preguntas sobre estos términos pueden enviarse al mantenedor del proyecto en github.com/Erickpe8.",
          ],
        },
      ],
    },
  },
};

export type LegalPageType = keyof (typeof legalContent)["en"];

export function getLegalDocument(
  locale: string,
  type: LegalPageType,
): LegalDocument {
  const lang = locale === "es" ? "es" : "en";
  return legalContent[lang][type];
}
