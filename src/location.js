import shallowEqual from 'fbjs/lib/shallowEqual';
import {restoreLocation} from './actions';
import {stringify} from 'qs';


const updated = callback => {
  let lastQuery;
  let lastPathname;

  return ({pathname, query, hash}) => {
    if (shallowEqual(lastQuery, query) && lastPathname === pathname) {
      return;
    }
    const search = stringify(query, {strictNullHandling: true});

    lastQuery = query;
    lastPathname = pathname;
    callback({pathname, search: search.length > 0 ? `?${search}` : '', hash});
  };
};


const push = history => updated(location => history.push(location));


export const location = (createHistory, type) => ({
  store, namespace = 'componentRouter', debounceTimeout = 50
}) => {
  const history = createHistory();
  const historyPush = push(history);

  let timer;

  const batchedHistoryPush = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => historyPush(...args), debounceTimeout);
  };

  const getState = () => store.getState()[namespace];

  const historyUnsubscribe = history.listen(({pathname, search, hash}) =>
    store.dispatch(restoreLocation({pathname, search, hash}, type)));

  const storeUnsubscribe = store.subscribe(() => batchedHistoryPush({
    pathname: getState().pathname,
    query: getState().cleanQuery,
    hash: getState().hash
  }));

  return () => {
    historyUnsubscribe();
    storeUnsubscribe();
  };
};
