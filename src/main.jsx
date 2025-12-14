import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import reportWebVitals from "./reportWebVitals.js";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n.js";
// import "bootstrap/dist/css/bootstrap.css";
import { ToastContainer } from "react-toastify";

// import {PrivyProvider} from '@privy-io/react-auth';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
      {/* <PrivyProvider
        appId="cmiucbnja0368l80cyits6xs2"
        config={{
          loginMethods: ['wallet'],
          embeddedWallets: {
            ethereum: {
              createOnLogin: 'false'
            }
          }
        }}
      > */}
    <I18nextProvider i18n={i18n}>
      <App />
      <ToastContainer />
    </I18nextProvider>
    {/* </PrivyProvider> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
