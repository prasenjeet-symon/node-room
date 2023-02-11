import { bootstrapNodeRoom } from '@noderoom/react-client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

bootstrapNodeRoom({
    canCache: true,
    defaultRoom: 'todoRoom',
    host: 'http://localhost:3000',
    supportOffline: true,
}).then(() => {
    console.log('ok connected...')
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
});
