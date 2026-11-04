'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface TgBackButton {
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TgApp {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  BackButton?: TgBackButton;
}

const getTg = (): TgApp | undefined =>
  (window as unknown as { Telegram?: { WebApp?: TgApp } }).Telegram?.WebApp;

/**
 * Глобальная инициализация Telegram Mini App:
 *  - ready / expand
 *  - отключает закрытие приложения свайпом вниз (иначе ломается pull-to-refresh)
 *  - кнопка «Назад» Telegram (и системный жест/кнопка «Назад» на Android) ведёт на прошлую страницу
 */
export function TelegramInit() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const tg = getTg();
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.disableVerticalSwipes?.();
  }, []);

  useEffect(() => {
    const back = getTg()?.BackButton;
    if (!back) return;

    const onBack = () => {
      if (window.history.length > 1) router.back();
      else router.push('/');
    };

    if (pathname === '/') back.hide();
    else back.show();

    back.onClick(onBack);
    return () => back.offClick(onBack);
  }, [pathname, router]);

  return null;
}
