import clsx from 'clsx';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';

import { StoreContext } from '../../contexts/StoreContext';
import { Text } from '../Text/Text';
import DismissIcon from '../icons/DismissIcon';

import * as styles from './StatusMessage.css';

const exitAnimationDuration = 300;
const statusMessageDuration = 3000;

interface Props {
  dismissable?: boolean;
}
export const StatusMessage = ({ dismissable = false }: Props) => {
  const [{ statusMessage }, dispatch] = useContext(StoreContext);
  const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const showStatusTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const [show, setShow] = useState(false);
  const [internalMessage, setInternalMessage] = useState(statusMessage);
  const { tone, message } = internalMessage || {};

  const closeHandler = useCallback(() => {
    setShow(false);

    cleanupTimerRef.current = setTimeout(() => {
      setInternalMessage(undefined);
      dispatch({ type: 'dismissMessage' });
    }, exitAnimationDuration);
  }, [dispatch]);

  useEffect(() => {
    if (statusMessage) {
      if (cleanupTimerRef.current) {
        clearTimeout(cleanupTimerRef.current);
      }
      if (showStatusTimerRef.current) {
        clearTimeout(showStatusTimerRef.current);
      }

      setInternalMessage(statusMessage);
      setShow(true);

      showStatusTimerRef.current = setTimeout(
        closeHandler,
        statusMessageDuration
      );
    } else {
      setShow(false);
    }
  }, [closeHandler, dispatch, statusMessage]);

  return (
    <div
      onClick={dismissable ? closeHandler : undefined}
      className={clsx(styles.status, {
        [styles.positive]: tone === 'positive',
        [styles.critical]: tone === 'critical',
        [styles.dismissable]: dismissable,
        [styles.show]: show,
      })}
    >
      <Text>{message}</Text>
      {dismissable ? (
        <div className={styles.dismiss}>
          <DismissIcon size="100%" />
        </div>
      ) : null}
    </div>
  );
};
