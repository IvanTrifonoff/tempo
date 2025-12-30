import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      app: {
        title: "tempo.TRFNV",
        settings: "Settings",
        upload: "Upload",
        login: "Login",
        logout: "Logout",
        metronome: "Metronome",
        coachMode: "Coach Mode",
        playlist: "Playlist",
        all: "All",
        favorites: "Favorites",
        newPlaylist: "New Playlist",
        create: "Create",
        cancel: "Cancel",
        playlistName: "Playlist Name...",
        addToPlaylist: "Add to Playlist",
        selectPlaylist: "Select Playlist",
        removeFromPlaylist: "Remove",
        noPlaylists: "No playlists created yet",
        support: "Support",
        language: "Language",
        languageDesc: "Interface language",
        notifications: "Notifications",
        notificationsOn: "Enabled",
        notificationsOff: "Enable for updates",
        enable: "Enable",
        inviteTitle: "Invite Students",
        inviteDesc: "Share your unique link",
        copyLink: "Copy Link",
        inviteCopied: "Invite link copied!",
        adminUsers: "User Management"
      },
      auth: {
        welcomeBack: "Welcome Back",
        createAccount: "Create Coach Account",
        studentReg: "Student Registration",
        verifyTitle: "Check your email",
        verifyDesc: "We sent a verification link. Please confirm to activate your account.",
        signInDesc: "Sign in to access your pro features",
        joinDesc: "Join the elite dance coaches community",
        email: "Email Address",
        password: "Password",
        signIn: "Sign In",
        signUp: "Sign Up",
        noAccount: "Don't have an account? Sign up",
        hasAccount: "Already have an account? Sign in",
        close: "Close"
      },
      player: {
        hide: "Hide Player",
        pauseCoach: "COACH PAUSE",
        nextDance: "Next dance in a moment...",
        bpm: "BPM TEMPO",
        base: "BASE",
        speed: "SPEED"
      },
      coach: {
        title: "Coach Mode",
        subtitle: "Automation Settings",
        autopilot: "Auto-pilot",
        autopilotDesc: "Track switching and pauses",
        danceDuration: "Dance Duration",
        feedbackPause: "Feedback Pause",
        clapDetection: "Clap Control",
        clapDesc: "Clap to pause/resume",
        sensitivity: "Mic Sensitivity",
        close: "Close"
      },
      admin: {
        title: "Upload Dance Music",
        trackTitle: "Track Title",
        artist: "Artist / Band",
        style: "Style",
        bpm: "BPM / Bars",
        file: "Audio File",
        cancel: "Cancel",
        upload: "Upload",
        uploading: "Uploading..."
      },
      confirm: {
        deleteTrack: "Are you sure you want to delete this track?"
      },
      styles: {
        "Cha-Cha-Cha": "Cha-Cha-Cha",
        "Slow Waltz": "Slow Waltz",
        "Viennese Waltz": "Viennese Waltz",
        "Tango": "Tango",
        "Quickstep": "Quickstep",
        "Rumba": "Rumba",
        "Pasodoble": "Pasodoble",
        "Foxtrot": "Foxtrot",
        "Jive": "Jive",
        "Kids": "Kids"
      },
      pwa: {
        offlineReady: "App ready to work offline",
        updateAvailable: "New version available!",
        reload: "Update",
        close: "Close"
      },
      update: {
        title: "Update Installed",
        desc: "We've improved text input in login screens. Keyboard issues are resolved.",
        action: "Awesome!"
      },
      edit: {
        title: "Edit Track",
        trackTitle: "Title",
        artist: "Artist",
        bpm: "BPM",
        style: "Style",
        save: "Save",
        cancel: "Cancel"
      }
    }
  },
  ru: {
    translation: {
      app: {
        title: "tempo.TRFNV",
        settings: "Настройки",
        upload: "Загрузить",
        login: "Вход",
        logout: "Выход",
        metronome: "Метроном",
        coachMode: "Режим тренера",
        playlist: "Плейлист",
        all: "Все",
        favorites: "Избранное",
        newPlaylist: "Новый плейлист",
        create: "Создать",
        cancel: "Отмена",
        playlistName: "Название...",
        addToPlaylist: "Добавить в плейлист",
        selectPlaylist: "Выберите плейлист",
        removeFromPlaylist: "Убрать",
        noPlaylists: "Плейлистов пока нет",
        support: "Поддержка",
        language: "Язык",
        languageDesc: "Язык интерфейса",
        notifications: "Уведомления",
        notificationsOn: "Включены",
        notificationsOff: "Включить для обновлений",
        enable: "Включить",
        inviteTitle: "Ваши ученики",
        inviteDesc: "Поделитесь ссылкой",
        copyLink: "Копировать ссылку",
        inviteCopied: "Ссылка скопирована!",
        adminUsers: "Пользователи"
      },
      auth: {
        welcomeBack: "С возвращением",
        createAccount: "Создать аккаунт тренера",
        studentReg: "Регистрация ученика",
        verifyTitle: "Проверьте почту",
        verifyDesc: "Мы отправили ссылку для подтверждения. Подтвердите для активации аккаунта.",
        signInDesc: "Войдите для доступа к функциям",
        joinDesc: "Присоединяйтесь к сообществу тренеров",
        email: "Email адрес",
        password: "Пароль",
        signIn: "Войти",
        signUp: "Регистрация",
        noAccount: "Нет аккаунта? Зарегистрируйтесь",
        hasAccount: "Есть аккаунт? Войти",
        close: "Закрыть"
      },
      player: {
        hide: "Скрыть плеер",
        pauseCoach: "ПАУЗА ТРЕНЕРА",
        nextDance: "Следующий танец через мгновение...",
        bpm: "BPM ТЕМП",
        base: "БАЗА",
        speed: "СКОРОСТЬ"
      },
      coach: {
        title: "Режим тренера",
        subtitle: "Настройки автоматизации",
        autopilot: "Авто-пилот",
        autopilotDesc: "Смена треков и паузы",
        danceDuration: "Длительность танца",
        feedbackPause: "Пауза на фидбек",
        clapDetection: "Управление хлопком",
        clapDesc: "Хлопните для паузы",
        sensitivity: "Чувствительность мик.",
        close: "Закрыть"
      },
      admin: {
        title: "Загрузка музыки",
        trackTitle: "Название трека",
        artist: "Исполнитель",
        style: "Стиль",
        bpm: "BPM / Такты",
        file: "Аудио файл",
        cancel: "Отмена",
        upload: "Загрузить",
        uploading: "Загрузка..."
      },
      confirm: {
        deleteTrack: "Вы уверены, что хотите удалить этот трек?"
      },
      styles: {
        "Cha-Cha-Cha": "Ча-Ча-Ча",
        "Slow Waltz": "Медленный Вальс",
        "Viennese Waltz": "Венский Вальс",
        "Tango": "Танго",
        "Quickstep": "Квикстеп",
        "Rumba": "Румба",
        "Pasodoble": "Пасодобль",
        "Foxtrot": "Фокстрот",
        "Jive": "Джайв",
        "Kids": "Для детей"
      },
      pwa: {
        offlineReady: "Приложение готово к работе оффлайн",
        updateAvailable: "Доступна новая версия!",
        reload: "Обновить",
        close: "Закрыть"
      },
      update: {
        title: "Обновление установлено",
        desc: "Мы исправили ввод текста при входе. Проблемы с клавиатурой решены.",
        action: "Отлично!"
      },
      edit: {
        title: "Редактировать трек",
        trackTitle: "Название",
        artist: "Исполнитель",
        bpm: "BPM",
        style: "Стиль",
        save: "Сохранить",
        cancel: "Отмена"
      }
    }
  },
  es: {
    translation: {
      app: {
        title: "tempo.TRFNV",
        settings: "Ajustes",
        upload: "Subir",
        login: "Entrar",
        logout: "Salir",
        metronome: "Metrónomo",
        coachMode: "Modo Entrenador",
        playlist: "Lista",
        all: "Todos",
        favorites: "Favoritos",
        newPlaylist: "Nueva Lista",
        create: "Crear",
        cancel: "Cancelar",
        playlistName: "Nombre...",
        addToPlaylist: "Añadir a la lista",
        selectPlaylist: "Seleccionar lista",
        removeFromPlaylist: "Quitar",
        noPlaylists: "No hay listas todavía",
        support: "Soporte",
        language: "Idioma",
        languageDesc: "Idioma de la interfaz",
        notifications: "Notificaciones",
        notificationsOn: "Activadas",
        notificationsOff: "Activar para actualizaciones",
        enable: "Activar",
        inviteTitle: "Tus estudiantes",
        inviteDesc: "Comparte tu enlace",
        copyLink: "Copiar enlace",
        inviteCopied: "¡Enlace copiado!",
        adminUsers: "Gestión de usuarios"
      },
      auth: {
        welcomeBack: "Bienvenido de nuevo",
        createAccount: "Crear cuenta de entrenador",
        studentReg: "Registro de estudiante",
        verifyTitle: "Revisa tu correo",
        verifyDesc: "Hemos enviado un enlace de verificación.",
        signInDesc: "Inicia sesión para acceder a funciones pro",
        joinDesc: "Únete a la comunidad de entrenadores",
        email: "Correo electrónico",
        password: "Contraseña",
        signIn: "Iniciar sesión",
        signUp: "Registrarse",
        noAccount: "¿No tienes cuenta? Regístrate",
        hasAccount: "¿Ya tienes cuenta? Inicia sesión",
        close: "Cerrar"
      },
      player: {
        hide: "Ocultar reproductor",
        pauseCoach: "PAUSA ENTRENADOR",
        nextDance: "Siguiente baile en un momento...",
        bpm: "TIEMPO BPM",
        base: "BASE",
        speed: "VELOCIDAD"
      },
      coach: {
        title: "Modo Entrenador",
        subtitle: "Configuración de automatización",
        autopilot: "Piloto automático",
        autopilotDesc: "Cambio de pistas y pausas",
        danceDuration: "Duración del baile",
        feedbackPause: "Pausa para feedback",
        clapDetection: "Control por aplauso",
        clapDesc: "Aplaude para pausar",
        sensitivity: "Sensibilidad mic.",
        close: "Cerrar"
      },
      admin: {
        title: "Subir música",
        trackTitle: "Título de la pista",
        artist: "Artista / Banda",
        style: "Estilo",
        bpm: "BPM",
        file: "Archivo de audio",
        cancel: "Cancelar",
        upload: "Subir",
        uploading: "Subiendo..."
      },
      confirm: {
        deleteTrack: "¿Estás seguro de que quieres eliminar esta pista?"
      },
      styles: {
        "Cha-Cha-Cha": "Cha-Cha-Cha",
        "Slow Waltz": "Vals Lento",
        "Viennese Waltz": "Vals Vienés",
        "Tango": "Tango",
        "Quickstep": "Quickstep",
        "Rumba": "Rumba",
        "Pasodoble": "Pasodoble",
        "Foxtrot": "Foxtrot",
        "Jive": "Jive",
        "Kids": "Para niños"
      },
      pwa: {
        offlineReady: "App lista para modo sin conexión",
        updateAvailable: "¡Nueva versión disponible!",
        reload: "Actualizar",
        close: "Cerrar"
      },
      update: {
        title: "Actualización instalada",
        desc: "Hemos arreglado la entrada de texto en el inicio de sesión.",
        action: "¡Genial!"
      },
      edit: {
        title: "Editar pista",
        trackTitle: "Título",
        artist: "Artista",
        bpm: "BPM",
        style: "Estilo",
        save: "Guardar",
        cancel: "Cancelar"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;