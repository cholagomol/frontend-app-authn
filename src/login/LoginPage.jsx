import { useEffect, useMemo, useState } from 'react';

import { getConfig } from '@edx/frontend-platform';
import { sendPageEvent, sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import { Form, StatefulButton, Icon } from '@openedx/paragon';
import { Lock } from '@openedx/paragon/icons';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import Skeleton from 'react-loading-skeleton';
import { Link, useLocation } from 'react-router-dom';

import {
  FormGroup,
  InstitutionLogistration,
  PasswordField,
  RedirectLogistration,
  ThirdPartyAuthAlert,
} from '../common-components';
import AccountActivationMessage from './AccountActivationMessage';
import { useThirdPartyAuthContext } from '../common-components/components/ThirdPartyAuthContext';
import { useThirdPartyAuthHook } from '../common-components/data/apiHook';
import EnterpriseSSO from '../common-components/EnterpriseSSO';
import ThirdPartyAuth from '../common-components/ThirdPartyAuth';
import { LOGIN_PAGE, PENDING_STATE, RESET_PAGE } from '../data/constants';
import {
  getActivationStatus,
  getAllPossibleQueryParams,
  getTpaHint,
  getTpaProvider,
  updatePathWithQueryParams,
} from '../data/utils';
import ResetPasswordSuccess from '../reset-password/ResetPasswordSuccess';
import { useLoginContext } from './components/LoginContext';
import { useLogin } from './data/apiHook';
import { INVALID_FORM, TPA_AUTHENTICATION_FAILURE } from './data/constants';
import LoginFailureMessage from './LoginFailure';
import messages from './messages';

const LoginPage = ({
  institutionLogin,
  handleInstitutionLogin,
}) => {
  const {
    thirdPartyAuthApiStatus,
    thirdPartyAuthContext,
    setThirdPartyAuthContextBegin,
    setThirdPartyAuthContextSuccess,
    setThirdPartyAuthContextFailure,
  } = useThirdPartyAuthContext();
  const location = useLocation();

  const {
    formFields,
    setFormFields,
    errors,
    setErrors,
  } = useLoginContext();

  const [loginResult, setLoginResult] = useState({ success: false, redirectUrl: '' });
  const [errorCode, setErrorCode] = useState({
    type: '',
    count: 0,
    context: {},
  });
  const { mutate: loginUser, isPending: isLoggingIn } = useLogin({
    onSuccess: (data) => {
      setLoginResult({ success: true, redirectUrl: data.redirectUrl || '' });
    },
    onError: (formattedError) => {
      setErrorCode(prev => ({
        type: formattedError.type,
        count: prev.count + 1,
        context: formattedError.context,
      }));
    },
  });

  const [showResetPasswordSuccessBanner,
    setShowResetPasswordSuccessBanner] = useState(location.state?.showResetPasswordSuccessBanner || null);
  const {
    providers,
    currentProvider,
    secondaryProviders,
    finishAuthUrl,
    platformName,
    errorMessage: thirdPartyErrorMessage,
  } = thirdPartyAuthContext;
  const { formatMessage } = useIntl();
  const activationMsgType = getActivationStatus();
  const queryParams = useMemo(() => getAllPossibleQueryParams(), []);

  const tpaHint = useMemo(() => getTpaHint(), []);
  const params = { ...queryParams };
  if (tpaHint) {
    params.tpa_hint = tpaHint;
  }
  const { data, isSuccess, error } = useThirdPartyAuthHook(LOGIN_PAGE, params);

  useEffect(() => {
    sendPageEvent('login_and_registration', 'login');
  }, []);

  useEffect(() => {
    setThirdPartyAuthContextBegin();
    if (isSuccess && data) {
      setThirdPartyAuthContextSuccess(
        data.fieldDescriptions,
        data.optionalFields,
        data.thirdPartyAuthContext,
      );
    }
    if (error) {
      setThirdPartyAuthContextFailure();
    }
  }, [tpaHint, queryParams, isSuccess, data, error,
    setThirdPartyAuthContextBegin, setThirdPartyAuthContextSuccess, setThirdPartyAuthContextFailure]);

  useEffect(() => {
    if (thirdPartyErrorMessage) {
      setErrorCode((prevState) => ({
        type: TPA_AUTHENTICATION_FAILURE,
        count: prevState.count + 1,
        context: {
          errorMessage: thirdPartyErrorMessage,
        },
      }));
    }
  }, [thirdPartyErrorMessage]);

  const validateFormFields = (payload) => {
    const { emailOrUsername, password } = payload;
    const fieldErrors = { ...errors };

    if (emailOrUsername === '') {
      fieldErrors.emailOrUsername = formatMessage(messages['email.validation.message']);
    }
    if (password === '') {
      fieldErrors.password = formatMessage(messages['password.validation.message']);
    }

    return fieldErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = { ...formFields };
    const validationErrors = validateFormFields(formData);
    if (validationErrors.emailOrUsername || validationErrors.password) {
      setErrors(validationErrors);
      setErrorCode(prev => ({ type: INVALID_FORM, count: prev.count + 1, context: {} }));
      return;
    }

    const payload = {
      email_or_username: formData.emailOrUsername,
      password: formData.password,
      ...queryParams,
    };
    loginUser(payload);
  };

  const handleOnChange = (event) => {
    const { name, value } = event.target;
    setFormFields(prevState => ({ ...prevState, [name]: value }));
  };

  const handleOnFocus = (event) => {
    const { name } = event.target;
    setErrors(prevErrors => ({ ...prevErrors, [name]: '' }));
  };

  const { provider, skipHintedLogin } = getTpaProvider(tpaHint, providers, secondaryProviders);

  if (tpaHint && thirdPartyAuthApiStatus === PENDING_STATE) {
    return <Skeleton height={36} />;
  }

  if (tpaHint && skipHintedLogin && provider) {
    window.location.href = getConfig().LMS_BASE_URL + provider.loginUrl;
    return null;
  }

  if (institutionLogin) {
    return (
      <InstitutionLogistration
        secondaryProviders={secondaryProviders}
        headingTitle={formatMessage(messages['institution.login.page.title'])}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{formatMessage(messages['login.page.title'], { siteName: getConfig().SITE_NAME })}</title>
      </Helmet>
      <RedirectLogistration
        success={loginResult.success}
        redirectUrl={loginResult.redirectUrl}
        finishAuthUrl={finishAuthUrl}
      />
      
      <div className="kku-login-container">
        <div className="kku-icon-header">
          <Icon src={Lock} />
        </div>
        <h2 className="kku-title">Sign In</h2>
        <p className="kku-subtitle">Sign in to your KKU Academy account</p>

        <LoginFailureMessage
          errorCode={errorCode.type}
          errorCount={errorCode.count}
          context={errorCode.context}
        />
        <ThirdPartyAuthAlert
          currentProvider={currentProvider}
          platformName={platformName}
        />
        <AccountActivationMessage messageType={activationMsgType} />
        {showResetPasswordSuccessBanner && <ResetPasswordSuccess />}

        <div className="kku-social-container">
          <ThirdPartyAuth
            currentProvider={currentProvider}
            providers={providers}
            secondaryProviders={secondaryProviders}
            handleInstitutionLogin={handleInstitutionLogin}
            thirdPartyAuthApiStatus={thirdPartyAuthApiStatus}
            isLoginPage
          />
        </div>

        <div className="kku-divider">or sign in with email</div>

        <Form id="sign-in-form" name="sign-in-form">
          <FormGroup
            name="emailOrUsername"
            value={formFields.emailOrUsername}
            autoComplete="on"
            handleChange={handleOnChange}
            handleFocus={handleOnFocus}
            errorMessage={errors.emailOrUsername}
            floatingLabel={formatMessage(messages['login.user.identity.label'])}
          />
          <PasswordField
            name="password"
            value={formFields.password}
            autoComplete="off"
            showScreenReaderText={false}
            showRequirements={false}
            handleChange={handleOnChange}
            handleFocus={handleOnFocus}
            errorMessage={errors.password}
            floatingLabel={formatMessage(messages['login.password.label'])}
          />
          
          <div className="d-flex justify-content-end mb-3">
            <Link
              id="forgot-password"
              className="text-muted small"
              to={updatePathWithQueryParams(RESET_PAGE)}
            >
              {formatMessage(messages['forgot.password'])}
            </Link>
          </div>

          <button
            type="submit"
            className="kku-gradient-btn"
            onClick={handleSubmit}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>
        </Form>
      </div>
    </>
  );
};

LoginPage.propTypes = {
  institutionLogin: PropTypes.bool.isRequired,
  handleInstitutionLogin: PropTypes.func.isRequired,
};

export default LoginPage;
