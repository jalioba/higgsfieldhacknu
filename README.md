# Higgsfield HackNU

Этот репозиторий содержит платформу для совместной работы (созданную для хакатона), которая объединяет холст (Excalidraw), AI-ассистента на базе Claude и генерацию изображений от Higgsfield AI. Проект разделен на клиентскую часть (React) и серверную часть (Node.js/Express).

## Структура проекта

```text
higgsfield/
├── client/                     # Клиентская часть (React + Vite)
│   ├── public/                 # Статические ассеты
│   ├── src/
│   │   ├── components/         # React компоненты
│   │   │   ├── Calendar/       # Компоненты календаря
│   │   │   ├── Canvas/         # Интеграция Excalidraw
│   │   │   ├── Chat/           # Чат с AI ассистентом
│   │   │   ├── Layout/         # Компоненты макета (Sidebar и др.)
│   │   │   └── Meet/           # Компоненты для Google Meet
│   │   ├── pages/              # Страницы приложения
│   │   │   ├── Dashboard.jsx   # Панель управления пользователя
│   │   │   ├── Landing.jsx     # Главная страница (Лендинг)
│   │   │   ├── Login.jsx       # Страница входа
│   │   │   ├── Register.jsx    # Страница регистрации
│   │   │   └── Workspace.jsx   # Рабочее пространство (Холст + Чат)
│   │   ├── services/           # Сервисы для взаимодействия с внешним миром
│   │   │   ├── api.js          # API клиент для общения с бэкендом
│   │   │   └── firebase.js     # Инициализация Firebase клиента
│   │   ├── styles/
│   │   │   └── index.css       # Глобальные стили
│   │   ├── App.jsx             # Корневой компонент
│   │   └── main.jsx            # Точка входа React
│   ├── index.html              # Главный HTML шаблон
│   ├── package.json            # Зависимости фронтенда
│   └── vite.config.js          # Конфигурация Vite сборщика
│
└── server/                     # Серверная часть (Node.js + Express)
    ├── data/                   # Локальное JSON-хранилище (База данных)
    │   ├── events.json         # События календаря
    │   ├── meetings.json       # Ссылки на встречи
    │   └── workspaces.json     # Данные рабочих пространств
    ├── routes/                 # Express маршруты (API Endpoints)
    │   ├── ai.js               # Чат с Claude (Anthropic API)
    │   ├── auth.js             # Авторизация
    │   ├── calendar.js         # API для календаря
    │   ├── canvas.js           # API для сохранения состояния холста
    │   ├── meet.js             # API для встреч
    │   └── workspaces.js       # API рабочих пространств
    ├── services/               # Бизнес-логика и API сторонних систем
    │   ├── firebase.js         # Конфигурация Firebase Admin (на бэкенде)
    │   └── higgsfield.js       # Интеграция с Higgsfield AI (генерация картинок)
    ├── utils/                  # Утилиты
    │   └── jsonStore.js        # Утилита для безопасной работы с JSON-файлами
    ├── .env.example            # Шаблон переменных окружения
    ├── package.json            # Зависимости бэкенда
    └── server.js               # Точка входа Express сервера
```

## Технологии

**Фронтенд:**
*   React 18
*   Vite
*   Excalidraw (для рисования и совместной работы)
*   React Router (для навигации)
*   Tailwind CSS / Vanilla CSS (стилизация)

**Бэкенд:**
*   Node.js & Express
*   @anthropic-ai/sdk (интеграция с Claude)
*   Обертки для работы с генерацией изображений Higgsfield AI
*   JSON локальное хранилище для быстрого прототипирования
*   Firebase Admin (для обеспечения совместной работы на холсте)


## Запуск



cd server
npm install package.json
npm start

cd client
npm install package.json
npm run dev