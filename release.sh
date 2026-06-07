#!/bin/bash

# Проверка наличия GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "Ошибка: утилита gh (GitHub CLI) не найдена. Пожалуйста, установите её."
    exit 1
fi

# Получение текущей даты
DATE=$(date +'%Y.%m.%d')

echo "Выберите тип релиза для публикации:"
echo "1) Preview (для тестеров) -> ветка preview"
echo "2) Production (для реальных пользователей) -> ветка production"
read -p "Введите выбор (1 или 2): " CHOICE

if [ "$CHOICE" == "1" ]; then
    TAG="v${DATE}-preview"
    TITLE="Release ${TAG}"
elif [ "$CHOICE" == "2" ]; then
    TAG="v${DATE}"
    TITLE="Release ${TAG}"
else
    echo "Отмена операции."
    exit 1
fi

# Проверка, нет ли уже такого тега локально или удаленно
if git rev-parse "$TAG" >/dev/null 2>&1; then
    # Если тег на эту дату уже есть, добавим порядковый номер внутри дня
    echo "Тег $TAG уже существует. Генерируем уникальный суффикс..."
    COUNT=1
    while true; do
        if [ "$CHOICE" == "1" ]; then
            NEW_TAG="v${DATE}.${COUNT}-preview"
        else
            NEW_TAG="v${DATE}.${COUNT}"
        fi
        
        if ! git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
            TAG="$NEW_TAG"
            TITLE="Release ${TAG}"
            break
        fi
        COUNT=$((COUNT+1))
    done
fi

echo "Публикуем релиз $TAG на GitHub..."

# Создаем релиз через GitHub CLI
gh release create "$TAG" --title "$TITLE" --notes "Генерируется ИИ-саммари..."

if [ $? -eq 0 ]; then
    echo "✓ Релиз $TAG успешно создан!"
    echo "GitHub Actions в фоне начал генерировать ИИ-саммари изменений и отправлять OTA-апдейт."
else
    echo "Не удалось создать релиз на GitHub. Убедитесь, что вы авторизованы через 'gh auth login'."
fi
