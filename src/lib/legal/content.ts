type LegalLocale = "en" | "es";

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

const CONTACT = "github.com/Erickpe8";
const UPDATED_EN = "Last updated: August 20, 2026";
const UPDATED_ES = "Última actualización: 20 de agosto de 2026";

export const legalContent: Record<
  LegalLocale,
  { privacy: LegalDocument; terms: LegalDocument }
> = {
  en: {
    privacy: {
      title: "Privacy Policy",
      updated: UPDATED_EN,
      intro:
        "YearOnGit is a free web product that builds a cinematic year-in-review (“Wrapped”) of your GitHub activity. Because we request read access to public and private repositories through GitHub OAuth, this policy explains exactly what we read, how we use it, what we store, and what we never do — including never collecting your GitHub password.",
      sections: [
        {
          title: "Data controller",
          paragraphs: [
            `The data controller for YearOnGit is the project maintainer reachable at ${CONTACT}. If you have privacy questions, want a copy of data we store about you, or want it deleted, contact that address.`,
          ],
        },
        {
          title: "What we collect and with what scope",
          paragraphs: [
            "When you sign in with GitHub, authentication is handled entirely by GitHub OAuth. We never see or store your GitHub password. We request read-only OAuth scopes (typically read:user and public_repo / related read scopes as configured) so we can load a year of activity for your Wrapped.",
            "Depending on the permissions you grant and what GitHub returns, we may read:",
          ],
          bullets: [
            "Profile basics: login, display name, avatar URL, bio, company, location, hireable flag, account creation date",
            "Social counts and org memberships when available (followers, following, organizations)",
            "Contribution activity for the Wrapped year: commits, pull requests, issues, code reviews, contribution calendar / heatmap, streaks",
            "Repository metadata needed for stats: names, owners, languages, stars, forks, privacy flag, sample owned repos",
            "Optional share / profile-card payloads you choose to create (public Wrapped link or README Markdown card)",
          ],
        },
        {
          title: "What we do not collect",
          paragraphs: [
            "We do not collect GitHub passwords, recovery codes, SSH keys, or payment credentials. We do not request write access to modify repositories, issues, or account settings. We do not sell personal data.",
          ],
        },
        {
          title: "How we use your data",
          paragraphs: [
            "Data is used only to operate YearOnGit:",
          ],
          bullets: [
            "Authenticate your session and keep OAuth tokens on the server",
            "Compute and display your Wrapped slides and summary",
            "Create or refresh a public share link or profile card if you ask for one",
            "Operate admin/maintenance features for the product owner",
            "Improve reliability (error logs without secrets)",
          ],
        },
        {
          title: "Storage and retention",
          paragraphs: [
            "OAuth access tokens are stored server-side (via the auth/database stack) for your signed-in session and are never sent to the browser as client-readable secrets.",
            "If you create a share link or profile card, we store the associated public payload (username, year, stats JSON, slug) until you revoke it or ask us to delete it, or until we remove inactive data as part of normal operations.",
            "Wrapped generation primarily processes GitHub API responses to build your experience. We do not keep a permanent copy of every GraphQL response beyond what is needed for session, shares, cards, and product settings.",
            "Browser local storage may keep preferences such as language, header visibility, sound mute, and cookie-consent choices. Those stay on your device until you clear site data or change preferences.",
          ],
        },
        {
          title: "Cookies and similar technologies",
          paragraphs: [
            "We use:",
          ],
          bullets: [
            "Essential: session / authentication cookies required to stay signed in; cookie-consent record so we remember your choice",
            "Preferences (local storage): language, header visibility, sound settings",
            "Analytics (optional): Google Analytics 4 only if you accept analytics cookies — never before consent",
          ],
        },
        {
          title: "Third parties",
          paragraphs: [
            "We share or process data with processors only as needed to run the product:",
          ],
          bullets: [
            "GitHub — authentication and activity APIs under GitHub’s policies",
            "Hosting / database providers (e.g. Vercel, Neon Postgres) — app hosting and persistence",
            "Google Analytics 4 — only if you opt in to analytics cookies",
            "Interface translations ship with the app; we do not send your GitHub activity to a separate translation API for Wrapped generation",
          ],
        },
        {
          title: "Your rights",
          paragraphs: [
            "You can stop using YearOnGit at any time. You may:",
          ],
          bullets: [
            "Revoke YearOnGit’s OAuth access in GitHub → Settings → Applications → Authorized OAuth Apps",
            "Sign out of YearOnGit to end the local session",
            "Contact the controller at " + CONTACT + " to request deletion of stored share/profile-card records tied to your account",
            "Withdraw analytics consent via the cookie banner controls (reset site data or clear the consent preference to see the banner again)",
            "Clear browser local storage to remove on-device preferences",
          ],
        },
        {
          title: "International users",
          paragraphs: [
            "YearOnGit is a global digital product. Servers may be located outside your country. By using the service you understand data may be processed in the regions where our hosting providers operate.",
          ],
        },
        {
          title: "Changes",
          paragraphs: [
            "We may update this policy. The “Last updated” date at the top will change when we do. Material changes may also be reflected in product notices.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            `Questions about privacy or data requests: ${CONTACT}.`,
          ],
        },
      ],
    },
    terms: {
      title: "Terms of Service",
      updated: UPDATED_EN,
      intro:
        "By accessing or using YearOnGit you agree to these Terms of Service. If you do not agree, do not sign in or use the Wrapped experience.",
      sections: [
        {
          title: "The service",
          paragraphs: [
            "YearOnGit is an independent web application that generates an annual “Wrapped”-style recap of GitHub activity (contributions, languages, streaks, highlights, and related stats) and optional sharing features such as public links and README/profile Markdown cards.",
          ],
        },
        {
          title: "No affiliation with GitHub",
          paragraphs: [
            "YearOnGit is not affiliated with, endorsed by, or sponsored by GitHub, Inc. “GitHub” and related marks belong to their owners. YearOnGit is an unofficial fan / developer tool built on GitHub’s public APIs and OAuth.",
          ],
        },
        {
          title: "Eligibility and accounts",
          paragraphs: [
            "You need a valid GitHub account and must comply with GitHub’s Terms of Service and Acceptable Use Policy. You are responsible for activity under your GitHub credentials and for the OAuth permissions you grant.",
          ],
        },
        {
          title: "Acceptable use",
          paragraphs: [
            "You agree not to misuse YearOnGit or its APIs, including:",
          ],
          bullets: [
            "Mass scraping, bulk automation, or abuse of GitHub or YearOnGit rate limits",
            "Attempting to access another user’s private data without authorization",
            "Interfering with service availability, security, or other users",
            "Misrepresenting YearOnGit stats as an official GitHub product",
            "Unlawful use of the service",
          ],
        },
        {
          title: "Profile cards and Markdown",
          paragraphs: [
            "If you generate a profile card image or Markdown snippet, you are solely responsible for what you publish on your own GitHub README or elsewhere. YearOnGit does not control third-party sites where you paste that content.",
          ],
        },
        {
          title: "Sharing links",
          paragraphs: [
            "Public share links expose the Wrapped payload you chose to publish. Anyone with the link may view that content. Revoke or stop sharing if you no longer want it public.",
          ],
        },
        {
          title: "Disclaimer of warranties",
          paragraphs: [
            "THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. We do not warrant uninterrupted uptime, perfect accuracy of every statistic, or continued availability of GitHub APIs.",
          ],
        },
        {
          title: "Limitation of liability",
          paragraphs: [
            "To the maximum extent permitted by law, YearOnGit and its maintainer are not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, or goodwill arising from your use of the service.",
          ],
        },
        {
          title: "Account and access termination",
          paragraphs: [
            "You may stop using the service and revoke OAuth access in GitHub at any time. We may suspend or terminate access for abuse, security risk, or to comply with law. Associated share/card records may be deleted upon request or as part of cleanup.",
          ],
        },
        {
          title: "Governing law",
          paragraphs: [
            "These terms are governed by the laws of the Republic of Colombia, without regard to conflict-of-law rules. Courts located in Colombia shall have exclusive jurisdiction over disputes arising from these terms, unless mandatory consumer protections in your country provide otherwise.",
          ],
        },
        {
          title: "Changes",
          paragraphs: [
            "We may update these terms. The “Last updated” date will change when we publish revisions. Continued use after changes means you accept the updated terms.",
          ],
        },
        {
          title: "Contact",
          paragraphs: [
            `Questions about these terms: ${CONTACT}.`,
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Política de privacidad",
      updated: UPDATED_ES,
      intro:
        "YearOnGit es un producto web gratuito que genera un resumen cinematográfico (“Wrapped”) de tu actividad en GitHub. Como solicitamos acceso de solo lectura a repositorios públicos y privados mediante OAuth de GitHub, esta política explica qué leemos, cómo lo usamos, qué guardamos y qué nunca hacemos — incluida la no recolección de tu contraseña de GitHub.",
      sections: [
        {
          title: "Responsable del tratamiento",
          paragraphs: [
            `El responsable del tratamiento de datos de YearOnGit es el mantenedor del proyecto en ${CONTACT}. Si tienes preguntas de privacidad, quieres una copia de los datos que guardamos sobre ti o quieres eliminarlos, contacta esa dirección.`,
          ],
        },
        {
          title: "Qué datos recolectamos y con qué alcance",
          paragraphs: [
            "Al iniciar sesión con GitHub, la autenticación la gestiona OAuth de GitHub. Nunca vemos ni guardamos tu contraseña. Pedimos scopes OAuth de solo lectura (p. ej. read:user y public_repo / scopes de lectura relacionados según la configuración) para cargar un año de actividad para tu Wrapped.",
            "Según los permisos que otorgues y lo que GitHub devuelva, podemos leer:",
          ],
          bullets: [
            "Datos básicos de perfil: login, nombre, avatar, bio, empresa, ubicación, hireable, fecha de creación",
            "Conteos sociales y organizaciones cuando estén disponibles",
            "Actividad del año del Wrapped: commits, pull requests, issues, code reviews, calendario/heatmap, rachas",
            "Metadatos de repositorios para estadísticas: nombres, owners, lenguajes, stars, forks, privacidad, muestras de repos",
            "Payloads opcionales de share / profile-card que tú crees (enlace público o tarjeta Markdown del README)",
          ],
        },
        {
          title: "Qué no recolectamos",
          paragraphs: [
            "No recolectamos contraseñas de GitHub, códigos de recuperación, claves SSH ni datos de pago. No pedimos acceso de escritura para modificar repos, issues o ajustes de cuenta. No vendemos datos personales.",
          ],
        },
        {
          title: "Cómo usamos tus datos",
          paragraphs: [
            "Los datos se usan solo para operar YearOnGit:",
          ],
          bullets: [
            "Autenticar tu sesión y mantener tokens OAuth en el servidor",
            "Calcular y mostrar tus slides y resumen del Wrapped",
            "Crear o refrescar un enlace público o profile card si lo pides",
            "Funciones de administración del producto",
            "Mejorar fiabilidad (logs de error sin secretos)",
          ],
        },
        {
          title: "Conservación y retención",
          paragraphs: [
            "Los tokens OAuth se guardan en el servidor (auth/base de datos) para tu sesión y no se exponen al navegador como secretos legibles.",
            "Si creas un enlace de share o profile card, guardamos el payload público asociado (usuario, año, stats, slug) hasta que lo revoques, pidas borrarlo o lo eliminemos en operaciones normales.",
            "La generación del Wrapped procesa respuestas de la API de GitHub para armar la experiencia. No conservamos una copia permanente de cada respuesta GraphQL más allá de lo necesario para sesión, shares, cards y ajustes del producto.",
            "El almacenamiento local del navegador puede guardar idioma, visibilidad del header, sonido y la elección de cookies. Permanecen en tu dispositivo hasta que borres datos del sitio o cambies preferencias.",
          ],
        },
        {
          title: "Cookies y tecnologías similares",
          paragraphs: [
            "Usamos:",
          ],
          bullets: [
            "Esenciales: cookies de sesión/autenticación; registro de consentimiento de cookies",
            "Preferencias (local storage): idioma, header, sonido",
            "Analítica (opcional): Google Analytics 4 solo si aceptas cookies de analítica — nunca antes del consentimiento",
          ],
        },
        {
          title: "Terceros",
          paragraphs: [
            "Compartimos o procesamos datos con encargados solo lo necesario para el producto:",
          ],
          bullets: [
            "GitHub — autenticación y APIs de actividad bajo sus políticas",
            "Hosting / base de datos (p. ej. Vercel, Neon Postgres)",
            "Google Analytics 4 — solo si optas por cookies de analítica",
            "Las traducciones de la interfaz van con la app; no enviamos tu actividad de GitHub a una API de traducción para generar el Wrapped",
          ],
        },
        {
          title: "Tus derechos",
          paragraphs: [
            "Puedes dejar de usar YearOnGit cuando quieras. También puedes:",
          ],
          bullets: [
            "Revocar el acceso OAuth en GitHub → Settings → Applications → Authorized OAuth Apps",
            "Cerrar sesión en YearOnGit",
            "Contactar al responsable en " + CONTACT + " para pedir la eliminación de shares/profile cards asociados a tu cuenta",
            "Retirar el consentimiento de analítica (borra datos del sitio o la preferencia de cookies para ver el banner otra vez)",
            "Borrar el almacenamiento local del navegador",
          ],
        },
        {
          title: "Usuarios internacionales",
          paragraphs: [
            "YearOnGit es un producto digital global. Los servidores pueden estar fuera de tu país. Al usar el servicio entiendes que los datos pueden procesarse donde operen nuestros proveedores de hosting.",
          ],
        },
        {
          title: "Cambios",
          paragraphs: [
            "Podemos actualizar esta política. La fecha de “Última actualización” cambiará cuando lo hagamos.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            `Preguntas de privacidad o solicitudes de datos: ${CONTACT}.`,
          ],
        },
      ],
    },
    terms: {
      title: "Términos de servicio",
      updated: UPDATED_ES,
      intro:
        "Al acceder o usar YearOnGit aceptas estos Términos de servicio. Si no estás de acuerdo, no inicies sesión ni uses el Wrapped.",
      sections: [
        {
          title: "El servicio",
          paragraphs: [
            "YearOnGit es una aplicación web independiente que genera un recap anual estilo “Wrapped” de tu actividad en GitHub (contribuciones, lenguajes, rachas, highlights y estadísticas relacionadas) y funciones opcionales de compartición como enlaces públicos y tarjetas Markdown para el README.",
          ],
        },
        {
          title: "Sin afiliación con GitHub",
          paragraphs: [
            "YearOnGit no está afiliado, respaldado ni patrocinado por GitHub, Inc. “GitHub” y marcas relacionadas pertenecen a sus titulares. YearOnGit es una herramienta no oficial basada en las APIs públicas y OAuth de GitHub.",
          ],
        },
        {
          title: "Elegibilidad y cuentas",
          paragraphs: [
            "Necesitas una cuenta válida de GitHub y cumplir los Términos y políticas de uso aceptable de GitHub. Eres responsable de la actividad bajo tus credenciales y de los permisos OAuth que otorgues.",
          ],
        },
        {
          title: "Uso aceptable",
          paragraphs: [
            "Aceptas no hacer un uso indebido de YearOnGit ni de sus APIs, incluyendo:",
          ],
          bullets: [
            "Scraping masivo, automatización abusiva o abuso de rate limits de GitHub o YearOnGit",
            "Intentar acceder a datos privados de otros sin autorización",
            "Interferir con la disponibilidad, seguridad u otros usuarios",
            "Presentar las stats de YearOnGit como producto oficial de GitHub",
            "Uso ilegal del servicio",
          ],
        },
        {
          title: "Profile cards y Markdown",
          paragraphs: [
            "Si generas una imagen de profile card o un snippet Markdown, eres el único responsable de lo que publiques en tu README de GitHub u otros sitios. YearOnGit no controla dónde pegues ese contenido.",
          ],
        },
        {
          title: "Enlaces para compartir",
          paragraphs: [
            "Los enlaces públicos exponen el payload del Wrapped que elegiste publicar. Quien tenga el enlace puede verlo. Revócalo si ya no quieres que sea público.",
          ],
        },
        {
          title: "Exención de garantías",
          paragraphs: [
            "EL SERVICIO SE OFRECE “TAL CUAL” Y “SEGÚN DISPONIBILIDAD”, SIN GARANTÍAS DE NINGÚN TIPO. No garantizamos uptime ininterrumpido, exactitud perfecta de cada estadística ni la disponibilidad continua de las APIs de GitHub.",
          ],
        },
        {
          title: "Limitación de responsabilidad",
          paragraphs: [
            "En la máxima medida permitida por la ley, YearOnGit y su mantenedor no responden por daños indirectos, incidentales, especiales, consecuenciales o punitivos, ni por pérdida de datos, beneficios o clientela derivados del uso del servicio.",
          ],
        },
        {
          title: "Terminación de cuenta y acceso",
          paragraphs: [
            "Puedes dejar de usar el servicio y revocar OAuth en GitHub en cualquier momento. Podemos suspender o terminar el acceso por abuso, riesgo de seguridad o cumplimiento legal. Los registros de share/card asociados pueden eliminarse a petición o en limpiezas operativas.",
          ],
        },
        {
          title: "Ley aplicable y jurisdicción",
          paragraphs: [
            "Estos términos se rigen por las leyes de la República de Colombia, sin perjuicio de normas de conflicto. Los tribunales de Colombia tendrán jurisdicción exclusiva sobre disputas derivadas de estos términos, salvo protecciones imperativas de consumo en tu país.",
          ],
        },
        {
          title: "Cambios",
          paragraphs: [
            "Podemos actualizar estos términos. La fecha de “Última actualización” cambiará al publicar revisiones. El uso continuado implica la aceptación de los términos actualizados.",
          ],
        },
        {
          title: "Contacto",
          paragraphs: [
            `Preguntas sobre estos términos: ${CONTACT}.`,
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
