import { useEffect, useState } from 'react';

import { getConfig } from '@edx/frontend-platform';
import { sendPageEvent, sendTrackEvent } from '@edx/frontend-platform/analytics';
import { useIntl } from '@edx/frontend-platform/i18n';
import {
  Form,
  Hyperlink,
  Icon,
} from '@openedx/paragon';
import { ChevronLeft } from '@openedx/paragon/icons';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useForgotPassword } from './data/apiHook';
import ForgotPasswordAlert from './ForgotPasswordAlert';
import messages from './messages';
import commonMessages from '../common-components/messages';
import { FormGroup } from '../common-components';
import { LOGIN_PAGE, REGISTER_PAGE, VALID_EMAIL_REGEX } from '../data/constants';
import { updatePathWithQueryParams, windowScrollTo } from '../data/utils';

const ForgotPasswordPage = () => {
  const platformName = getConfig().SITE_NAME;
  const emailRegex = new RegExp(VALID_EMAIL_REGEX, 'i');
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [bannerEmail, setBannerEmail] = useState('');
  const [formErrors, setFormErrors] = useState('');
  const [validationError, setValidationError] = useState('');
  const [status, setStatus] = useState(location.state?.status || null);

  // React Query hook for forgot password
  const { mutate: sendForgotPassword, isPending: isSending } = useForgotPassword();

  useEffect(() => {
    sendPageEvent('login_and_registration', 'reset');
    sendTrackEvent('edx.bi.password_reset_form.viewed', { category: 'user-engagement' });
  }, []);

  useEffect(() => {
    if (status === 'complete') {
      setEmail('');
    }
  }, [status]);

  const getValidationMessage = (value) => {
    let error = '';

    if (value === '') {
      error = formatMessage(messages['forgot.password.empty.email.field.error']);
    } else if (!emailRegex.test(value)) {
      error = formatMessage(messages['forgot.password.page.invalid.email.message']);
    }

    return error;
  };

  const handleBlur = () => {
    setValidationError(getValidationMessage(email));
  };

  const handleFocus = () => {
    setValidationError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBannerEmail(email);

    const validateError = getValidationMessage(email);
    if (validateError) {
      setFormErrors(validateError);
      setValidationError(validateError);
      windowScrollTo({ left: 0, top: 0, behavior: 'smooth' });
    } else {
      setFormErrors('');
      sendForgotPassword(email, {
        onSuccess: (data, emailUsed) => {
          setStatus('complete');
          setBannerEmail(emailUsed);
          setFormErrors('');
        },
        onError: (error) => {
          if (error.response && error.response.status === 403) {
            setStatus('forbidden');
          } else {
            setStatus('server-error');
          }
        },
      });
    }
  };

  return (
    <div className="kku-auth-wrapper">
      <Helmet>
        <title>{formatMessage(messages['forgot.password.page.title'],
          { siteName: getConfig().SITE_NAME })}
        </title>
      </Helmet>
      
      <div className="kku-auth-card">
        {/* Left Panel */}
        <div className="kku-left-panel">
          <div className="kku-overlay">
            <div className="overlay-text-normal">{formatMessage(commonMessages['overlay.sub.text'])}</div>
            <div className="overlay-text-bold">{formatMessage(commonMessages['overlay.main.text'])}</div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="kku-right-panel">
          {/* Back to Sign In Link */}
          <Link
            to={updatePathWithQueryParams(LOGIN_PAGE)}
            className="kku-back-link"
          >
            <Icon src={ChevronLeft} />
            <span>{formatMessage(messages['sign.in.text'])}</span>
          </Link>

          <h2 className="kku-title">
            {formatMessage(messages['forgot.password.page.heading'])}
          </h2>
          <p className="kku-subtitle">
            {formatMessage(messages['forgot.password.page.instructions'])}
          </p>

          <Form id="forget-password-form" name="forget-password-form" onSubmit={handleSubmit}>
            <ForgotPasswordAlert email={bannerEmail} emailError={formErrors} status={status} />
            
            <FormGroup
              floatingLabel={formatMessage(messages['forgot.password.page.email.field.label'])}
              name="email"
              value={email}
              autoComplete="on"
              errorMessage={validationError}
              handleChange={(e) => setEmail(e.target.value)}
              handleBlur={handleBlur}
              handleFocus={handleFocus}
            />

            <button
              id="submit-forget-password"
              name="submit-forget-password"
              type="submit"
              className="kku-gradient-btn"
              disabled={isSending}
            >
              {isSending ? 'Submitting...' : formatMessage(messages['forgot.password.page.submit.button'])}
            </button>
          </Form>

          {/* Footer 1: Additional Help */}
          <div className="kku-footer-help">
            <p className="mb-0 text-muted">
              {formatMessage(messages['additional.help.text'], { platformName })}
              <span className="mx-1">
                <Hyperlink isInline destination={`mailto:${getConfig().INFO_EMAIL}`}>{getConfig().INFO_EMAIL}</Hyperlink>
              </span>
            </p>
          </div>

          {/* Footer 2: Sign Up Link */}
          <div className="kku-footer-signup">
            <p className="mb-0">
              Don't have an account?
              <Link
                to={updatePathWithQueryParams(REGISTER_PAGE)}
                className="signup-link"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
