import { useEffect, useState } from 'react';
import './FavoriteToast.css';

export default function FavoriteToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className={`favorite-toast ${visible ? 'favorite-toast--visible' : ''}`} role="status">
      <div className="favorite-toast__card">
        <span className="favorite-toast__icon">★</span>
        <div>
          <div className="favorite-toast__title">{toast.title}</div>
          <div className="favorite-toast__message">{toast.message}</div>
        </div>
      </div>
    </div>
  );
}
