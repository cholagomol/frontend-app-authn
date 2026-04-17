import { useEffect, useState } from 'react';

import { getConfig } from '@edx/frontend-platform';
import { sendPageEvent, sendTrackEvent } from '@edx/frontend-platform/analytics';
import { getAuthService } from '@edx/frontend-platform/auth';
import { useIntl } from '@edx/frontend-platform/i18n';
import PropTypes from 'prop-types';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';

import BaseContainer from '../base-container';
import { ThirdPartyAuthProvider, useThirdPartyAuthContext } from '../common-components/components/ThirdPartyAuthContext';
import messages from '../common-components/messages';
import { LOGIN_PAGE, REGISTER_PAGE } from '../data/constants';
import {
  getTpaHint, getTpaProvider, updatePathWithQueryParams,
} from '../data/utils';
import { LoginProvider } from '../login/components/LoginContext';
import LoginComponentSlot from '../plugin-slots/LoginComponentSlot';
import { RegistrationPage } from '../register';
import { RegisterProvider } from '../register/components/RegisterContext';

const LogistrationPageInner = (props) => {
  const {
    thirdPartyAuthContext,
    clearThirdPartyAuthErrorMessage,
  } = useThirdPartyAuthContext();

  const {
    providers,
    secondaryProviders,
  } = thirdPartyAuthContext;

  const location = useLocation();
  const selectedPage = location.pathname.includes('/login') ? LOGIN_PAGE : (props.selectedPage || REGISTER_PAGE);

  const { formatMessage } = useIntl();
  const [institutionLogin, setInstitutionLogin] = useState(false);
  const [key, setKey] = useState('');
  const navigate = useNavigate();
  const disablePublicAccountCreation = getConfig().ALLOW_PUBLIC_ACCOUNT_CREATION === false;
  const hideRegistrationLink = getConfig().SHOW_REGISTRATION_LINKS === false;

  useEffect(() => {
    const authService = getAuthService();
    if (authService) {
      authService.getCsrfTokenService()
        .getCsrfToken(getConfig().LMS_BASE_URL);
    }
  }, []);

  useEffect(() => {
    if (disablePublicAccountCreation) {
      navigate(updatePathWithQueryParams(LOGIN_PAGE));
    }
  }, [navigate, disablePublicAccountCreation]);

  const handleInstitutionLogin = (e) => {
    sendTrackEvent('edx.bi.institution_login_form.toggled', { category: 'user-engagement' });
    if (typeof e === 'string') {
      sendPageEvent('login_and_registration', e === '/login' ? 'login' : 'register');
    } else {
      sendPageEvent('login_and_registration', e.target.dataset.eventName);
    }
    setInstitutionLogin(!institutionLogin);
  };

  const handleOnSelect = (tabKey, currentTab) => {
    if (tabKey === currentTab) {
      return;
    }
    sendTrackEvent(`edx.bi.${tabKey.replace('/', '')}_form.toggled`, { category: 'user-engagement' });
    clearThirdPartyAuthErrorMessage();
    setKey(tabKey);
  };

  const isValidTpaHint = () => {
    const { provider } = getTpaProvider(getTpaHint(), providers, secondaryProviders);
    return !!provider;
  };

  const isLoginPage = selectedPage === LOGIN_PAGE;

  return (
    <div className="kku-auth-wrapper">
      <div className="kku-auth-card">
        {/* Left Panel - Single Background Image (handled in CSS) */}
        <div className="kku-left-panel">
          <div className="kku-overlay">
            <div className="overlay-text-combined">Learning with Us KKU Academy</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="kku-right-panel">
          {/* Tabs */}
          {!disablePublicAccountCreation && !isValidTpaHint() && !hideRegistrationLink && (
            <div className="kku-tabs">
              <button
                type="button"
                className={`kku-tab ${!isLoginPage ? 'active' : ''}`}
                onClick={() => handleOnSelect(REGISTER_PAGE, selectedPage)}
              >
                {formatMessage(messages['logistration.register'])}
              </button>
              <button
                type="button"
                className={`kku-tab ${isLoginPage ? 'active' : ''}`}
                onClick={() => handleOnSelect(LOGIN_PAGE, selectedPage)}
              >
                {formatMessage(messages['logistration.sign.in'])}
              </button>
            </div>
          )}

          {key && (
            <Navigate to={updatePathWithQueryParams(key)} replace />
          )}

          {/* Form Content */}
          <div className="form-area">
            <div id="main-content">
              {isLoginPage
                ? (
                  <LoginComponentSlot
                    institutionLogin={institutionLogin}
                    handleInstitutionLogin={handleInstitutionLogin}
                  />
                )
                : (
                  <RegistrationPage
                    institutionLogin={institutionLogin}
                    handleInstitutionLogin={handleInstitutionLogin}
                  />
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

LogistrationPageInner.propTypes = {
  selectedPage: PropTypes.string,
};

LogistrationPageInner.defaultProps = {
  selectedPage: REGISTER_PAGE,
};

const LogistrationPage = (props) => (
  <ThirdPartyAuthProvider>
    <RegisterProvider>
      <LoginProvider>
        <LogistrationPageInner {...props} />
      </LoginProvider>
    </RegisterProvider>
  </ThirdPartyAuthProvider>
);

export default LogistrationPage;
