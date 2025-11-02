import http2 from 'node:http2';

const OLX_ORIGIN = 'https://www.olx.pl';
const DEFAULT_PAGE_SIZE = 40;
const MAX_PAGE_SIZE = 40;
const MIN_PAGE_SIZE = 1;

const CONDITION_PARAM_MAP = {
  new: 'new',
  used: 'used',
  refurbished: 'refurbished',
  renewed: 'renewed',
  damaged: 'damaged',
  parts: 'for_parts',
  'for-parts': 'for_parts',
};

const SELLER_TYPE_PARAM_MAP = {
  private: 'private',
  individual: 'private',
  person: 'private',
  business: 'company',
  company: 'company',
  dealer: 'company',
};

const DELIVERY_PARAM_MAP = {
  courier: 'courier',
  shipping: 'courier',
  parcel: 'parcel',
  'parcel-locker': 'parcel',
  parcel_locker: 'parcel',
  parcellocker: 'parcel',
  olx_delivery: 'olx_delivery',
  olx: 'olx_delivery',
  pickup: 'selfpickup',
  selfpickup: 'selfpickup',
  personal: 'selfpickup',
};

const SORT_PARAM_MAP = {
  newest: 'created_at:desc',
  recent: 'created_at:desc',
  oldest: 'created_at:asc',
  cheapest: 'price:asc',
  expensive: 'price:desc',
  price_asc: 'price:asc',
  price_desc: 'price:desc',
  relevance: 'relevance:desc',
};

const BASE_HEADERS = {
  ':scheme': 'https',
  ':authority': 'www.olx.pl',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'application/json, text/plain, */*',
  'accept-language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
  origin: 'https://www.olx.pl',
  referer: 'https://www.olx.pl/',
  pragma: 'no-cache',
  'cache-control': 'no-cache',
};

/**
 * Primary entry point for querying the OLX public JSON API over HTTP/2.
 */
export async function scrapeOLXWithApi(query = '', options = {}) {
  const {
    maxPages = 2,
    minPrice,
    maxPrice,
    withDelivery,
    location,
    category,
    condition,
    sellerType,
    delivery,
    deliveryOptions,
    sortBy,
  } = options;

  const results = [];
  const sanitizedQuery = typeof query === 'string' ? query.trim() : '';
  const boundedPages = Math.max(1, Math.min(5, maxPages || 1));
  const pageSize = Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, options.pageSize || DEFAULT_PAGE_SIZE));

  for (let pageIndex = 0; pageIndex < boundedPages; pageIndex += 1) {
    const offset = pageIndex * pageSize;
    const params = buildApiParams({
      query: sanitizedQuery,
      offset,
      limit: pageSize,
      minPrice,
      maxPrice,
      withDelivery,
      location,
      category,
      condition,
      sellerType,
      delivery,
      deliveryOptions,
      sortBy,
    });

    const response = await requestOffers(params);
    const offers = Array.isArray(response?.data) ? response.data : [];
    if (!offers.length) {
      break;
    }

    const transformed = offers.map(transformOffer).filter(Boolean);
    results.push(...transformed);

    if (offers.length < pageSize) {
      break;
    }
  }

  return results;
}

/**
 * Execute a single HTTP/2 request to the OLX API.
 */
async function requestOffers(params) {
  const path = `/api/v1/offers/?${params.toString()}`;
  const client = http2.connect(OLX_ORIGIN);

  return new Promise((resolve, reject) => {
    let closed = false;
    let timer;
    let statusCode = 0;
    let raw = '';

    const cleanup = (err) => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      try {
        client.close();
      } catch (_) {
        // ignore close errors
      }
      if (err) {
        reject(err);
      }
    };

    client.on('error', (err) => cleanup(err));

    const requestHeaders = {
      ...BASE_HEADERS,
      ':method': 'GET',
      ':path': path,
    };

    const req = client.request(requestHeaders);
    req.setEncoding('utf8');

    timer = setTimeout(() => {
      req.close(http2.constants.NGHTTP2_CANCEL);
      cleanup(newError('OLX API request timed out', 'OLX_API_TIMEOUT'));
    }, 15000);
    timer.unref?.();

    req.on('response', (headers) => {
      const status = headers[':status'];
      statusCode = typeof status === 'number' ? status : Number.parseInt(String(status ?? 0), 10) || 0;
    });

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (statusCode !== 200) {
        cleanup(newError(`OLX API request failed with status ${statusCode}`, statusCode === 403 ? 'OLX_API_FORBIDDEN' : 'OLX_API_ERROR'));
        return;
      }

      try {
        const parsed = raw ? JSON.parse(raw) : { data: [] };
        cleanup();
        resolve(parsed);
      } catch (err) {
        cleanup(newError('Failed to parse OLX API response', 'OLX_API_PARSE_ERROR', err));
      }
    });

    req.on('error', (err) => {
      cleanup(newError('OLX API connection error', 'OLX_API_CONNECTION_ERROR', err));
    });

    req.end();
  });
}

function buildApiParams({
  query,
  offset,
  limit,
  minPrice,
  maxPrice,
  withDelivery,
  location,
  category,
  condition,
  sellerType,
  delivery,
  deliveryOptions,
  sortBy,
}) {
  const params = new URLSearchParams();
  const hasLocation = typeof location === 'string' && location.trim().length > 0 && location !== 'all';
  const searchQuery = hasLocation && query ? `${query} ${location}` : (query || 'elektronika');

  params.set('offset', String(Math.max(0, offset || 0)));
  params.set('limit', String(Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, limit || DEFAULT_PAGE_SIZE))));
  params.set('query', searchQuery);
  params.set('search[description]', '1');

  if (minPrice) {
    params.set('search[filter_float_price:from]', String(minPrice));
  }
  if (maxPrice) {
    params.set('search[filter_float_price:to]', String(maxPrice));
  }
  if (withDelivery) {
    params.set('search[delivery][available]', 'true');
  }

  if (category && category !== 'all') {
    params.set('search[category_id]', String(category));
  }

  if (condition && condition !== 'all') {
    const key = condition.toString().toLowerCase();
    const mapped = CONDITION_PARAM_MAP[key] || key;
    params.set('search[filter_enum_condition][0]', mapped);
  }

  if (sellerType && sellerType !== 'all') {
    const key = sellerType.toString().toLowerCase();
    const mapped = SELLER_TYPE_PARAM_MAP[key] || key;
    params.set('search[filter_enum_offer_type][0]', mapped);
  }

  const deliveryList = Array.isArray(deliveryOptions) && deliveryOptions.length
    ? deliveryOptions
    : (delivery && delivery !== 'all' ? [delivery] : []);

  deliveryList
    .map((entry) => DELIVERY_PARAM_MAP[entry.toString().toLowerCase()] || entry)
    .filter(Boolean)
    .forEach((value, index) => {
      params.append(`search[filter_enum_delivery_methods][${index}]`, value);
    });

  if (sortBy) {
    const key = sortBy.toString().toLowerCase();
    const mapped = SORT_PARAM_MAP[key] || sortBy;
    params.set('search[sort]', mapped);
  }

  return params;
}

function transformOffer(offer) {
  if (!offer || typeof offer !== 'object') {
    return null;
  }

  const priceParam = Array.isArray(offer.params)
    ? offer.params.find((param) => param?.key === 'price')
    : undefined;

  const priceValue = priceParam?.value?.value ?? null;
  const currency = priceParam?.value?.currency ?? 'PLN';
  const priceLabel = priceParam?.value?.label ?? null;

  const locationParts = [];
  if (offer.location?.city?.name) {
    locationParts.push(offer.location.city.name);
  }
  if (offer.location?.region?.name) {
    locationParts.push(offer.location.region.name);
  }
  const locationLabel = locationParts.join(', ') || null;

  const photos = Array.isArray(offer.photos)
    ? offer.photos
        .map(formatPhotoUrl)
        .filter((url) => typeof url === 'string' && url.length > 5)
    : [];

  const attributes = Array.isArray(offer.params)
    ? offer.params
        .filter((param) => param?.name && param?.value && param.key !== 'price')
        .map((param) => ({
          key: param.key,
          label: param.name,
          value: extractParamValue(param.value),
        }))
    : [];

  const deliveryOptions = collectDeliveryOptions(offer);

  return {
    id: offer.id ?? offer.external_id ?? offer.url,
    title: offer.title ?? '',
    description: normalizeDescription(offer.description) ?? undefined,
    url: offer.url,
    price: priceValue ?? undefined,
    priceLabel: priceLabel ?? undefined,
    currency,
    location: locationLabel ?? undefined,
    images: photos.length ? photos : undefined,
    image: photos[0] ?? undefined,
    sellerName: offer.user?.name ?? null,
    sellerProfileUrl: offer.user?.id ? `https://www.olx.pl/uzytkownik/${offer.user.id}` : null,
    sellerType: normalizeSellerType(offer.user?.seller_type, offer.business),
    sellerAvatar: offer.user?.photo ?? null,
    deliveryOptions: deliveryOptions.length ? deliveryOptions : undefined,
    deliveryAvailable: deliveryOptions.length > 0 || Boolean(offer.delivery?.rock?.active),
    publishedAt: offer.created_time ? new Date(offer.created_time).toISOString() : undefined,
    updatedAt: offer.last_refresh_time ? new Date(offer.last_refresh_time).toISOString() : undefined,
    marketplace: 'olx',
    attributes: attributes.length ? attributes : undefined,
    categoryId: offer.category?.id ?? null,
    categoryType: offer.category?.type ?? null,
    coordinates: offer.map?.lat && offer.map?.lon ? { lat: offer.map.lat, lon: offer.map.lon } : undefined,
  };
}

function formatPhotoUrl(photo) {
  if (!photo || typeof photo !== 'object') {
    return null;
  }
  const link = photo.link || photo.original || photo.thumbnail;
  if (!link || typeof link !== 'string') {
    return null;
  }
  return link
    .replace('{width}', '1200')
    .replace('{height}', '900');
}

function extractParamValue(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'object') {
    if (value.label) {
      return value.label;
    }
    if (value.key) {
      return value.key;
    }
    if (value.value) {
      return String(value.value);
    }
  }
  return null;
}

function collectDeliveryOptions(offer) {
  const options = new Set();

  if (offer.delivery?.rock?.active) {
    options.add('olx delivery');
  }
  if (offer.contact?.courier) {
    options.add('courier');
  }
  if (offer.contact?.negotiation) {
    options.add('negotiation');
  }
  if (offer.contact?.chat) {
    options.add('chat');
  }

  return Array.from(options);
}

function normalizeSellerType(value, businessFlag) {
  if (typeof value === 'string' && value.length) {
    return value;
  }
  if (typeof businessFlag === 'boolean') {
    return businessFlag ? 'business' : 'private';
  }
  return null;
}

function normalizeDescription(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  return value
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>(\s*\n)?/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function newError(message, code, original) {
  const error = original instanceof Error ? original : new Error(message);
  if (!(error instanceof Error)) {
    return Object.assign(new Error(message), { code });
  }
  error.message = message;
  if (code) {
    error.code = code;
  }
  return error;
}

export default {
  scrapeOLXWithApi,
};
