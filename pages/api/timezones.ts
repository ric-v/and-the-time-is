import { NextApiRequest, NextApiResponse } from 'next';

import getCurrentTime from '../../functions/timeNow';

// source: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
export const timezoneList = [
  { code: 'UTC', name: 'UTC', city: 'UTC', country: 'Universal' },
  { code: 'Etc/UTC', name: 'UTC', city: 'UTC', country: 'Universal' },
  { code: 'Etc/UCT', name: 'UCT', city: 'UCT', country: 'Universal' },
  { code: 'Etc/Universal', name: 'Universal', city: 'Universal', country: 'Universal' },
  { code: 'Etc/Zulu', name: 'Zulu', city: 'Zulu', country: 'Universal' },
  { code: 'GMT', name: 'Greenwich Mean Time', city: 'London', country: 'United Kingdom' },
  { code: 'AD', name: 'Europe/Andorra', city: 'Andorra', country: 'Andorra' },
  { code: 'AE,OM', name: 'Asia/Dubai', city: 'Abu Dhabi', country: 'United Arab Emirates' },
  { code: 'AF', name: 'Asia/Kabul', city: 'Kabul', country: 'Afghanistan' },
  { code: 'AG', name: 'America/Antigua', city: 'Antigua', country: 'Antigua and Barbuda' },
  { code: 'AI', name: 'America/Anguilla', city: 'Anguilla', country: 'Anguilla' },
  { code: 'AL', name: 'Europe/Tirane', city: 'Tirane', country: 'Albania' },
  { code: 'AM', name: 'Asia/Yerevan', city: 'Yerevan', country: 'Armenia' },
  { code: 'AO', name: 'Africa/Luanda', city: 'Luanda', country: 'Angola' },
  { code: 'AQ', name: 'Antarctica/Casey', city: 'Casey', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Davis', city: 'Davis', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/DumontDUrville', city: 'DumontDUrville', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Mawson', city: 'Mawson', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/McMurdo', city: 'McMurdo', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Palmer', city: 'Palmer', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Rothera', city: 'Rothera', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Syowa', city: 'Syowa', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Troll', city: 'Troll', country: 'Antarctica' },
  { code: 'AQ', name: 'Antarctica/Vostok', city: 'Vostok', country: 'Antarctica' },
  { code: 'AR', name: 'America/Argentina/Buenos_Aires', city: 'Buenos Aires', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Catamarca', city: 'Catamarca', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Cordoba', city: 'Cordoba', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Jujuy', city: 'Jujuy', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/La_Rioja', city: 'La Rioja', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Mendoza', city: 'Mendoza', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Rio_Gallegos', city: 'Rio Gallegos', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Salta', city: 'Salta', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/San_Juan', city: 'San Juan', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/San_Luis', city: 'San Luis', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Tucuman', city: 'Tucuman', country: 'Argentina' },
  { code: 'AR', name: 'America/Argentina/Ushuaia', city: 'Ushuaia', country: 'Argentina' },
  { code: 'AS', name: 'Pacific/Pago_Pago', city: 'Pago Pago', country: 'American Samoa' },
  { code: 'AT', name: 'Europe/Vienna', city: 'Vienna', country: 'Austria' },
  { code: 'AU', name: 'Australia/Macquarie', city: 'Macquarie', country: 'Australia' },
  { code: 'AU', name: 'Australia/Adelaide', city: 'Adelaide', country: 'Australia' },
  { code: 'AU', name: 'Australia/Brisbane', city: 'Brisbane', country: 'Australia' },
  { code: 'AU', name: 'Australia/Broken_Hill', city: 'Broken Hill', country: 'Australia' },
  { code: 'AU', name: 'Australia/Currie', city: 'Currie', country: 'Australia' },
  { code: 'AU', name: 'Australia/Darwin', city: 'Darwin', country: 'Australia' },
  { code: 'AU', name: 'Australia/Eucla', city: 'Eucla', country: 'Australia' },
  { code: 'AU', name: 'Australia/Hobart', city: 'Hobart', country: 'Australia' },
  { code: 'AU', name: 'Australia/Lindeman', city: 'Lindeman', country: 'Australia' },
  { code: 'AU', name: 'Australia/Lord_Howe', city: 'Lord Howe', country: 'Australia' },
  { code: 'AU', name: 'Australia/Melbourne', city: 'Melbourne', country: 'Australia' },
  { code: 'AU', name: 'Australia/Perth', city: 'Perth', country: 'Australia' },
  { code: 'AU', name: 'Australia/Sydney', city: 'Sydney', country: 'Australia' },
  { code: 'AW', name: 'America/Aruba', city: 'Aruba', country: 'Aruba' },
  { code: 'AX', name: 'Europe/Mariehamn', city: 'Mariehamn', country: 'Aland Islands' },
  { code: 'AZ', name: 'Asia/Baku', city: 'Baku', country: 'Azerbaijan' },
  { code: 'BA', name: 'Europe/Sarajevo', city: 'Sarajevo', country: 'Bosnia and Herzegovina' },
  { code: 'BB', name: 'America/Barbados', city: 'Barbados', country: 'Barbados' },
  { code: 'BD', name: 'Asia/Dhaka', city: 'Dhaka', country: 'Bangladesh' },
  { code: 'BE', name: 'Europe/Brussels', city: 'Brussels', country: 'Belgium' },
  { code: 'BF', name: 'Africa/Ouagadougou', city: 'Ouagadougou', country: 'Burkina Faso' },
  { code: 'BG', name: 'Europe/Sofia', city: 'Sofia', country: 'Bulgaria' },
  { code: 'BH', name: 'Asia/Bahrain', city: 'Bahrain', country: 'Bahrain' },
  { code: 'BI', name: 'Africa/Bujumbura', city: 'Bujumbura', country: 'Burundi' },
  { code: 'BJ', name: 'Africa/Porto-Novo', city: 'Porto-Novo', country: 'Benin' },
  { code: 'BL', name: 'America/St_Barthelemy', city: 'St Barthelemy', country: 'Saint Barthelemy' },
  { code: 'BM', name: 'Atlantic/Bermuda', city: 'Bermuda', country: 'Bermuda' },
  { code: 'BN', name: 'Asia/Brunei', city: 'Brunei', country: 'Brunei' },
  { code: 'BO', name: 'America/La_Paz', city: 'La Paz', country: 'Bolivia' },
  { code: 'BQ', name: 'America/Kralendijk', city: 'Kralendijk', country: 'Bonaire' },
  { code: 'BR', name: 'America/Sao_Paulo', city: 'Sao Paulo', country: 'Brazil' },
  { code: 'BS', name: 'America/Nassau', city: 'Nassau', country: 'Bahamas' },
  { code: 'BT', name: 'Asia/Thimphu', city: 'Thimphu', country: 'Bhutan' },
  { code: 'BV', name: 'Antarctica/Syowa', city: 'Syowa', country: 'Bouvet Island' },
  { code: 'BW', name: 'Africa/Gaborone', city: 'Gaborone', country: 'Botswana' },
  { code: 'BY', name: 'Europe/Minsk', city: 'Minsk', country: 'Belarus' },
  { code: 'BZ', name: 'America/Belize', city: 'Belize', country: 'Belize' },
  { code: 'CA', name: 'America/Toronto', city: 'Toronto', country: 'Canada' },
  { code: 'CC', name: 'Indian/Cocos', city: 'Cocos', country: 'Cocos (Keeling) Islands' },
  { code: 'CD', name: 'Africa/Kinshasa', city: 'Kinshasa', country: 'Democratic Republic of the Congo' },
  { code: 'CF', name: 'Africa/Bangui', city: 'Bangui', country: 'Central African Republic' },
  { code: 'CG', name: 'Africa/Brazzaville', city: 'Brazzaville', country: 'Republic of the Congo' },
  { code: 'CH', name: 'Europe/Zurich', city: 'Zurich', country: 'Switzerland' },
  { code: 'CI', name: 'Africa/Abidjan', city: 'Abidjan', country: 'Ivory Coast' },
  { code: 'CK', name: 'Pacific/Rarotonga', city: 'Rarotonga', country: 'Cook Islands' },
  { code: 'CL', name: 'America/Santiago', city: 'Santiago', country: 'Chile' },
  { code: 'CM', name: 'Africa/Douala', city: 'Douala', country: 'Cameroon' },
  { code: 'CN', name: 'Asia/Shanghai', city: 'Shanghai', country: 'China' },
  { code: 'CO', name: 'America/Bogota', city: 'Bogota', country: 'Colombia' },
  { code: 'CR', name: 'America/Costa_Rica', city: 'Costa Rica', country: 'Costa Rica' },
  { code: 'CU', name: 'America/Havana', city: 'Havana', country: 'Cuba' },
  { code: 'CV', name: 'Atlantic/Cape_Verde', city: 'Cape Verde', country: 'Cape Verde' },
  { code: 'CW', name: 'America/Curacao', city: 'Curacao', country: 'Curacao' },
  { code: 'CX', name: 'Indian/Christmas', city: 'Christmas', country: 'Christmas Island' },
  { code: 'CY', name: 'Asia/Nicosia', city: 'Nicosia', country: 'Cyprus' },
  { code: 'CZ', name: 'Europe/Prague', city: 'Prague', country: 'Czech Republic' },
  { code: 'DE', name: 'Europe/Berlin', city: 'Berlin', country: 'Germany' },
  { code: 'DJ', name: 'Africa/Djibouti', city: 'Djibouti', country: 'Djibouti' },
  { code: 'DK', name: 'Europe/Copenhagen', city: 'Copenhagen', country: 'Denmark' },
  { code: 'DM', name: 'America/Dominica', city: 'Dominica', country: 'Dominica' },
  { code: 'DO', name: 'America/Santo_Domingo', city: 'Santo Domingo', country: 'Dominican Republic' },
  { code: 'DZ', name: 'Africa/Algiers', city: 'Algiers', country: 'Algeria' },
  { code: 'EC', name: 'America/Guayaquil', city: 'Guayaquil', country: 'Ecuador' },
  { code: 'EE', name: 'Europe/Tallinn', city: 'Tallinn', country: 'Estonia' },
  { code: 'EG', name: 'Africa/Cairo', city: 'Cairo', country: 'Egypt' },
  { code: 'EH', name: 'Africa/El_Aaiun', city: 'El Aaiun', country: 'Western Sahara' },
  { code: 'ER', name: 'Africa/Asmara', city: 'Asmara', country: 'Eritrea' },
  { code: 'ES', name: 'Europe/Madrid', city: 'Madrid', country: 'Spain' },
  { code: 'ET', name: 'Africa/Addis_Ababa', city: 'Addis Ababa', country: 'Ethiopia' },
  { code: 'FI', name: 'Europe/Helsinki', city: 'Helsinki', country: 'Finland' },
  { code: 'FJ', name: 'Pacific/Fiji', city: 'Fiji', country: 'Fiji' },
  { code: 'FK', name: 'Atlantic/Stanley', city: 'Stanley', country: 'Falkland Islands' },
  { code: 'FM', name: 'Pacific/Ponape', city: 'Ponape', country: 'Micronesia' },
  { code: 'FO', name: 'Atlantic/Faroe', city: 'Faroe', country: 'Faroe Islands' },
  { code: 'FR', name: 'Europe/Paris', city: 'Paris', country: 'France' },
  { code: 'GA', name: 'Africa/Libreville', city: 'Libreville', country: 'Gabon' },
  { code: 'GB', name: 'Europe/London', city: 'London', country: 'United Kingdom' },
  { code: 'GD', name: 'America/Grenada', city: 'Grenada', country: 'Grenada' },
  { code: 'GE', name: 'Asia/Tbilisi', city: 'Tbilisi', country: 'Georgia' },
  { code: 'GF', name: 'America/Cayenne', city: 'Cayenne', country: 'French Guiana' },
  { code: 'GG', name: 'Europe/Guernsey', city: 'Guernsey', country: 'Guernsey' },
  { code: 'GH', name: 'Africa/Accra', city: 'Accra', country: 'Ghana' },
  { code: 'GI', name: 'Europe/Gibraltar', city: 'Gibraltar', country: 'Gibraltar' },
  { code: 'GL', name: 'America/Godthab', city: 'Godthab', country: 'Greenland' },
  { code: 'GM', name: 'Africa/Banjul', city: 'Banjul', country: 'Gambia' },
  { code: 'GN', name: 'Africa/Conakry', city: 'Conakry', country: 'Guinea' },
  { code: 'GP', name: 'America/Guadeloupe', city: 'Guadeloupe', country: 'Guadeloupe' },
  { code: 'GQ', name: 'Africa/Malabo', city: 'Malabo', country: 'Equatorial Guinea' },
  { code: 'GR', name: 'Europe/Athens', city: 'Athens', country: 'Greece' },
  { code: 'GS', name: 'Atlantic/South_Georgia', city: 'South Georgia', country: 'South Georgia and the South Sandwich Islands' },
  { code: 'GT', name: 'America/Guatemala', city: 'Guatemala', country: 'Guatemala' },
  { code: 'GU', name: 'Pacific/Guam', city: 'Guam', country: 'Guam' },
  { code: 'GW', name: 'Africa/Bissau', city: 'Bissau', country: 'Guinea-Bissau' },
  { code: 'GY', name: 'America/Guyana', city: 'Guyana', country: 'Guyana' },
  { code: 'HK', name: 'Asia/Hong_Kong', city: 'Hong Kong', country: 'Hong Kong' },
  { code: 'HN', name: 'America/Tegucigalpa', city: 'Tegucigalpa', country: 'Honduras' },
  { code: 'HR', name: 'Europe/Zagreb', city: 'Zagreb', country: 'Croatia' },
  { code: 'HT', name: 'America/Port-au-Prince', city: 'Port-au-Prince', country: 'Haiti' },
  { code: 'HU', name: 'Europe/Budapest', city: 'Budapest', country: 'Hungary' },
  { code: 'ID', name: 'Asia/Jakarta', city: 'Jakarta', country: 'Indonesia' },
  { code: 'IE', name: 'Europe/Dublin', city: 'Dublin', country: 'Ireland' },
  { code: 'IL', name: 'Asia/Jerusalem', city: 'Jerusalem', country: 'Israel' },
  { code: 'IN', name: 'Asia/Calcutta', city: 'Calcutta', country: 'India' },
  { code: 'IN', name: 'Asia/Kolkata', city: 'Kolkata', country: 'India' },
  { code: 'IO', name: 'Indian/Chagos', city: 'Chagos', country: 'Mauritius' },
  { code: 'IQ', name: 'Asia/Baghdad', city: 'Baghdad', country: 'Iraq' },
  { code: 'IR', name: 'Asia/Tehran', city: 'Tehran', country: 'Iran' },
  { code: 'IS', name: 'Atlantic/Reykjavik', city: 'Reykjavik', country: 'Iceland' },
  { code: 'IT', name: 'Europe/Rome', city: 'Rome', country: 'Italy' },
  { code: 'JM', name: 'America/Jamaica', city: 'Jamaica', country: 'Jamaica' },
  { code: 'JO', name: 'Asia/Amman', city: 'Amman', country: 'Jordan' },
  { code: 'JP', name: 'Asia/Tokyo', city: 'Tokyo', country: 'Japan' },
  { code: 'KE', name: 'Africa/Nairobi', city: 'Nairobi', country: 'Kenya' },
  { code: 'KG', name: 'Asia/Bishkek', city: 'Bishkek', country: 'Kyrgyzstan' },
  { code: 'KI', name: 'Pacific/Tarawa', city: 'Tarawa', country: 'Kiribati' },
  { code: 'KI', name: 'Pacific/Kirtimati', city: 'Kiritimati', country: 'Kiribati' },
  { code: 'KI', name: 'Pacific/Tarawa', city: 'Tarawa', country: 'Kiribati' },
  { code: 'KP', name: 'Asia/Pyongyang', city: 'Pyongyang', country: 'North Korea' },
  { code: 'KR', name: 'Asia/Seoul', city: 'Seoul', country: 'South Korea' },
  { code: 'KW', name: 'Asia/Kuwait', city: 'Kuwait', country: 'Kuwait' },
  { code: 'KZ', name: 'Asia/Almaty', city: 'Almaty', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Aqtau', city: 'Aqtau', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Aqtobe', city: 'Aqtobe', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Atyrau', city: 'Atyrau', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Oral', city: 'Oral', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Qostanay', city: 'Qostanay', country: 'Kazakhstan' },
  { code: 'KZ', name: 'Asia/Qyzylorda', city: 'Qyzylorda', country: 'Kazakhstan' },
  { code: 'LB', name: 'Asia/Beirut', city: 'Beirut', country: 'Lebanon' },
  { code: 'LC', name: 'America/St_Lucia', city: 'St. Lucia', country: 'Saint Lucia' },
  { code: 'LI', name: 'Europe/Vaduz', city: 'Vaduz', country: 'Liechtenstein' },
  { code: 'LK', name: 'Asia/Colombo', city: 'Colombo', country: 'Sri Lanka' },
  { code: 'LR', name: 'Africa/Monrovia', city: 'Monrovia', country: 'Liberia' },
  { code: 'LS', name: 'Africa/Maseru', city: 'Maseru', country: 'Lesotho' },
  { code: 'LT', name: 'Europe/Vilnius', city: 'Vilnius', country: 'Lithuania' },
  { code: 'LU', name: 'Europe/Luxembourg', city: 'Luxembourg', country: 'Luxembourg' },
  { code: 'LV', name: 'Europe/Riga', city: 'Riga', country: 'Latvia' },
  { code: 'LY', name: 'Africa/Tripoli', city: 'Tripoli', country: 'Libya' },
  { code: 'MA', name: 'Africa/Casablanca', city: 'Casablanca', country: 'Morocco' },
  { code: 'MC', name: 'Europe/Monaco', city: 'Monaco', country: 'Monaco' },
  { code: 'MD', name: 'Europe/Chisinau', city: 'Chisinau', country: 'Moldova' },
  { code: 'MD', name: 'Europe/Tiraspol', city: 'Tiraspol', country: 'Moldova' },
  { code: 'ME', name: 'Europe/Podgorica', city: 'Podgorica', country: 'Montenegro' },
  { code: 'MF', name: 'America/Marigot', city: 'Marigot', country: 'Saint Martin' },
  { code: 'MG', name: 'Indian/Antananarivo', city: 'Antananarivo', country: 'Madagascar' },
  { code: 'MH', name: 'Pacific/Kwajalein', city: 'Kwajalein', country: 'Marshall Islands' },
  { code: 'MH', name: 'Pacific/Majuro', city: 'Majuro', country: 'Marshall Islands' },
  { code: 'MK', name: 'Europe/Skopje', city: 'Skopje', country: 'Macedonia' },
  { code: 'ML', name: 'Africa/Bamako', city: 'Bamako', country: 'Mali' },
  { code: 'ML', name: 'Africa/Timbuktu', city: 'Timbuktu', country: 'Mali' },
  { code: 'MM', name: 'Asia/Rangoon', city: 'Rangoon', country: 'Myanmar' },
  { code: 'MM', name: 'Asia/Yangon', city: 'Yangon', country: 'Myanmar' },
  { code: 'MN', name: 'Asia/Choibalsan', city: 'Choibalsan', country: 'Mongolia' },
  { code: 'MN', name: 'Asia/Hovd', city: 'Hovd', country: 'Mongolia' },
  { code: 'MN', name: 'Asia/Ulaanbaatar', city: 'Ulaanbaatar', country: 'Mongolia' },
  { code: 'MN', name: 'Asia/Ulan_Bator', city: 'Ulan Bator', country: 'Mongolia' },
  { code: 'MO', name: 'Asia/Macau', city: 'Macau', country: 'Macau' },
  { code: 'MP', name: 'Pacific/Saipan', city: 'Saipan', country: 'Northern Mariana Islands' },
  { code: 'MQ', name: 'America/Martinique', city: 'Martinique', country: 'Martinique' },
  { code: 'MR', name: 'Africa/Nouakchott', city: 'Nouakchott', country: 'Mauritania' },
  { code: 'MS', name: 'America/Montserrat', city: 'Montserrat', country: 'Montserrat' },
  { code: 'MT', name: 'Europe/Malta', city: 'Malta', country: 'Malta' },
  { code: 'MU', name: 'Indian/Mauritius', city: 'Mauritius', country: 'Mauritius' },
  { code: 'MV', name: 'Indian/Maldives', city: 'Maldives', country: 'Maldives' },
  { code: 'MW', name: 'Africa/Blantyre', city: 'Blantyre', country: 'Malawi' },
  { code: 'MX', name: 'America/Bahia_Banderas', city: 'Bahia Banderas', country: 'Mexico' },
  { code: 'MX', name: 'America/Cancun', city: 'Cancun', country: 'Mexico' },
  { code: 'MX', name: 'America/Chihuahua', city: 'Chihuahua', country: 'Mexico' },
  { code: 'MX', name: 'America/Ensenada', city: 'Ensenada', country: 'Mexico' },
  { code: 'MX', name: 'America/Hermosillo', city: 'Hermosillo', country: 'Mexico' },
  { code: 'MX', name: 'America/Matamoros', city: 'Matamoros', country: 'Mexico' },
  { code: 'MX', name: 'America/Mazatlan', city: 'Mazatlan', country: 'Mexico' },
  { code: 'MX', name: 'America/Merida', city: 'Merida', country: 'Mexico' },
  { code: 'MX', name: 'America/Mexico_City', city: 'Mexico City', country: 'Mexico' },
  { code: 'MX', name: 'America/Monterrey', city: 'Monterrey', country: 'Mexico' },
  { code: 'MX', name: 'America/Ojinaga', city: 'Ojinaga', country: 'Mexico' },
  { code: 'MX', name: 'America/Santa_Isabel', city: 'Santa Isabel', country: 'Mexico' },
  { code: 'MX', name: 'America/Tijuana', city: 'Tijuana', country: 'Mexico' },
  { code: 'MX', name: 'Mexico/BajaNorte', city: 'BajaNorte', country: 'Mexico' },
  { code: 'MX', name: 'Mexico/BajaSur', city: 'BajaSur', country: 'Mexico' },
  { code: 'MX', name: 'Mexico/General', city: 'General', country: 'Mexico' },
  { code: 'MY', name: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', country: 'Malaysia' },
  { code: 'MY', name: 'Asia/Kuching', city: 'Kuching', country: 'Malaysia' },
  { code: 'MZ', name: 'Africa/Maputo', city: 'Maputo', country: 'Mozambique' },
  { code: 'NA', name: 'Africa/Windhoek', city: 'Windhoek', country: 'Namibia' },
  { code: 'NC', name: 'Pacific/Noumea', city: 'Noumea', country: 'New Caledonia' },
  { code: 'NE', name: 'Africa/Niamey', city: 'Niamey', country: 'Niger' },
  { code: 'NF', name: 'Pacific/Norfolk', city: 'Norfolk', country: 'Norfolk Island' },
  { code: 'NG', name: 'Africa/Lagos', city: 'Lagos', country: 'Nigeria' },
  { code: 'NI', name: 'America/Managua', city: 'Managua', country: 'Nicaragua' },
  { code: 'NL', name: 'Europe/Amsterdam', city: 'Amsterdam', country: 'Netherlands' },
  { code: 'NO', name: 'Europe/Oslo', city: 'Oslo', country: 'Norway' },
  { code: 'NP', name: 'Asia/Kathmandu', city: 'Kathmandu', country: 'Nepal' },
  { code: 'NR', name: 'Pacific/Nauru', city: 'Nauru', country: 'Nauru' },
  { code: 'NU', name: 'Pacific/Niue', city: 'Niue', country: 'Niue' },
  { code: 'NZ', name: 'Pacific/Chatham', city: 'Chatham', country: 'New Zealand' },
  { code: 'NZ', name: 'Pacific/Auckland', city: 'Auckland', country: 'New Zealand' },
  { code: 'PA', name: 'America/Panama', city: 'Panama', country: 'Panama' },
  { code: 'PE', name: 'America/Lima', city: 'Lima', country: 'Peru' },
  { code: 'PF', name: 'Pacific/Gambier', city: 'Gambier', country: 'French Polynesia' },
  { code: 'PF', name: 'Pacific/Marquesas', city: 'Marquesas', country: 'French Polynesia' },
  { code: 'PF', name: 'Pacific/Tahiti', city: 'Tahiti', country: 'French Polynesia' },
  { code: 'PG', name: 'Pacific/Bougainville', city: 'Bougainville', country: 'Papua New Guinea' },
  { code: 'PG', name: 'Pacific/Port_Moresby', city: 'Port Moresby', country: 'Papua New Guinea' },
  { code: 'PH', name: 'Asia/Manila', city: 'Manila', country: 'Philippines' },
  { code: 'PK', name: 'Asia/Karachi', city: 'Karachi', country: 'Pakistan' },
  { code: 'PL', name: 'Europe/Warsaw', city: 'Warsaw', country: 'Poland' },
  { code: 'PM', name: 'America/Miquelon', city: 'Miquelon', country: 'Saint Pierre and Miquelon' },
  { code: 'PN', name: 'Pacific/Pitcairn', city: 'Pitcairn', country: 'Pitcairn' },
  { code: 'PR', name: 'America/Puerto_Rico', city: 'Puerto Rico', country: 'Puerto Rico' },
  { code: 'PS', name: 'Asia/Gaza', city: 'Gaza', country: 'Palestine' },
  { code: 'PS', name: 'Asia/Hebron', city: '', country: '' },
  { code: 'PS', name: 'Asia/Gaza', city: 'Gaza', country: 'Palestine' },
  { code: 'PS', name: 'Asia/Hebron', city: 'Hebron', country: 'Palastine' },
  { code: 'PT', name: 'Atlantic/Azores', city: 'Azores', country: 'Portugal' },
  { code: 'PT', name: 'Atlantic/Madeira', city: 'Madeira Islands', country: 'Portugal' },
  { code: 'PT', name: 'Europe/Lisbon', city: 'Lisbon', country: 'Portugal' },
  { code: 'PW', name: 'Pacific/Palau', city: 'Palau', country: 'Palau' },
  { code: 'PY', name: 'America/Asuncion', city: 'Asuncion', country: 'Paraguay' },
  { code: 'QA', name: 'Asia/Qatar', city: 'Doha', country: 'Qatar' },
  { code: 'RE', name: 'Indian/Reunion', city: 'Saint-Denis', country: 'Reunion' },
  { code: 'RO', name: 'Europe/Bucharest', city: 'Bucharest', country: 'Romania' },
  { code: 'RS', name: 'Europe/Belgrade', city: 'Belgrade', country: 'Serbia' },
  { code: 'RU', name: 'Asia/Anadyr', city: 'Anadyr', country: 'Russia' },
  { code: 'RU', name: 'Asia/Barnaul', city: 'Barnaul', country: 'Russia' },
  { code: 'RU', name: 'Asia/Chita', city: 'Chita', country: 'Russia' },
  { code: 'RU', name: 'Asia/Irkutsk', city: 'Irkutsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Kamchatka', city: 'Kamchatka', country: 'Russia' },
  { code: 'RU', name: 'Asia/Krasnoyarsk', city: 'Krasnoyarsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Magadan', city: 'Magadan', country: 'Russia' },
  { code: 'RU', name: 'Asia/Novokuznetsk', city: 'Novokuznetsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Novosibirsk', city: 'Novosibirsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Omsk', city: 'Omsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Sakhalin', city: 'Sakhalin', country: 'Russia' },
  { code: 'RU', name: 'Asia/Vladivostok', city: 'Vladivostok', country: 'Russia' },
  { code: 'RU', name: 'Asia/Yakutsk', city: 'Yakutsk', country: 'Russia' },
  { code: 'RU', name: 'Asia/Yekaterinburg', city: 'Yekaterinburg', country: 'Russia' },
  { code: 'RU', name: 'Europe/Astrakhan', city: 'Astrakhan', country: 'Russia' },
  { code: 'RU', name: 'Europe/Kaliningrad', city: 'Kaliningrad', country: 'Russia' },
  { code: 'RU', name: 'Europe/Kirov', city: 'Kirov', country: 'Russia' },
  { code: 'RU', name: 'Europe/Moscow', city: 'Moscow', country: 'Russia' },
  { code: 'RU', name: 'Europe/Samara', city: 'Samara', country: 'Russia' },
  { code: 'RU', name: 'Europe/Saratov', city: 'Saratov', country: 'Russia' },
  { code: 'RU', name: 'Europe/Ulyanovsk', city: 'Ulyanovsk', country: 'Russia' },
  { code: 'RU', name: 'Europe/Volgograd', city: 'Volgograd', country: 'Russia' },
  { code: 'RU', name: 'Europe/Simferopol', city: 'Simferopol', country: 'Crimea' },
  { code: 'RW', name: 'Africa/Kigali', city: 'Kigali', country: 'Rwanda' },
  { code: 'SA', name: 'Asia/Riyadh', city: 'Riyadh', country: 'Saudi Arabia' },
  { code: 'SB', name: 'Pacific/Guadalcanal', city: 'Honiara', country: 'Solomon Islands' },
  { code: 'SC', name: 'Indian/Mahe', city: 'Mahe', country: 'Seychelles' },
  { code: 'SD', name: 'Africa/Khartoum', city: 'Khartoum', country: 'Sudan' },
  { code: 'SE', name: 'Europe/Stockholm', city: 'Stockholm', country: 'Sweden' },
  { code: 'SG', name: 'Asia/Singapore', city: 'Singapore', country: 'Singapore' },
  { code: 'SH', name: 'Atlantic/St_Helena', city: 'St. Helena', country: 'St. Helena' },
  { code: 'SI', name: 'Europe/Ljubljana', city: 'Ljubljana', country: 'Slovenia' },
  { code: 'SJ', name: 'Arctic/Longyearbyen', city: 'Longyearbyen', country: 'Svalbard' },
  { code: 'SK', name: 'Europe/Bratislava', city: 'Bratislava', country: 'Slovakia' },
  { code: 'SL', name: 'Africa/Freetown', city: 'Freetown', country: 'Sierra Leone' },
  { code: 'SM', name: 'Europe/San_Marino', city: 'San Marino', country: 'San Marino' },
  { code: 'SN', name: 'Africa/Dakar', city: 'Dakar', country: 'Senegal' },
  { code: 'SO', name: 'Africa/Mogadishu', city: 'Mogadishu', country: 'Somalia' },
  { code: 'SR', name: 'America/Paramaribo', city: 'Paramaribo', country: 'Suriname' },
  { code: 'SS', name: 'Africa/Juba', city: 'Juba', country: 'South Sudan' },
  { code: 'ST', name: 'Africa/Sao_Tome', city: 'Sao Tome', country: 'Sao Tome and Principe' },
  { code: 'SV', name: 'America/El_Salvador', city: 'San Salvador', country: 'El Salvador' },
  { code: 'SX', name: 'America/Lower_Princes', city: 'Lower Princes', country: 'Sint Maarten' },
  { code: 'SY', name: 'Asia/Damascus', city: 'Damascus', country: 'Syria' },
  { code: 'SZ', name: 'Africa/Mbabane', city: 'Mbabane', country: 'Swaziland' },
  { code: 'TC', name: 'America/Grand_Turk', city: 'Grand Turk', country: 'Turks and Caicos Islands' },
  { code: 'TD', name: 'Africa/Ndjamena', city: 'Ndjamena', country: 'Chad' },
  { code: 'TF', name: 'Indian/Kerguelen', city: 'Kerguelen', country: 'French Southern Territories' },
  { code: 'TG', name: 'Africa/Lome', city: 'Lome', country: 'Togo' },
  { code: 'TH', name: 'Asia/Bangkok', city: 'Bangkok', country: 'Thailand' },
  { code: 'TJ', name: 'Asia/Dushanbe', city: 'Dushanbe', country: 'Tajikistan' },
  { code: 'TK', name: 'Pacific/Fakaofo', city: 'Fakaofo', country: 'Tokelau' },
  { code: 'TL', name: 'Asia/Dili', city: 'Dili', country: 'Timor-Leste' },
  { code: 'TM', name: 'Asia/Ashgabat', city: 'Ashgabat', country: 'Turkmenistan' },
  { code: 'TN', name: 'Africa/Tunis', city: 'Tunis', country: 'Tunisia' },
  { code: 'TO', name: 'Pacific/Tongatapu', city: 'Tongatapu', country: 'Tonga' },
  { code: 'TR', name: 'Europe/Istanbul', city: 'Istanbul', country: 'Turkey' },
  { code: 'TT', name: 'America/Port_of_Spain', city: 'Port of Spain', country: 'Trinidad and Tobago' },
  { code: 'TV', name: 'Pacific/Funafuti', city: 'Funafuti', country: 'Tuvalu' },
  { code: 'TW', name: 'Asia/Taipei', city: 'Taipei', country: 'Taiwan' },
  { code: 'TZ', name: 'Africa/Dar_es_Salaam', city: 'Dar es Salaam', country: 'Tanzania' },
  { code: 'UA', name: 'Europe/Kiev', city: 'Kiev', country: 'Ukraine' },
  { code: 'UA', name: 'Europe/Uzhgorod', city: 'Uzhgorod', country: 'Ukraine' },
  { code: 'UA', name: 'Europe/Zaporozhye', city: 'Zaporozhye', country: 'Ukraine' },
  { code: 'UG', name: 'Africa/Kampala', city: 'Kampala', country: 'Uganda' },
  { code: 'UM', name: 'Pacific/Wake', city: 'Wake', country: 'United States Minor Outlying Islands' },
  { code: 'US', name: 'America/Adak', city: 'Adak', country: 'United States' },
  { code: 'US', name: 'America/Anchorage', city: 'Anchorage', country: 'United States' },
  { code: 'US', name: 'America/Boise', city: 'Boise', country: 'United States' },
  { code: 'US', name: 'America/Chicago', city: 'Chicago', country: 'United States' },
  { code: 'US', name: 'America/Denver', city: 'Denver', country: 'United States' },
  { code: 'US', name: 'America/Detroit', city: 'Detroit', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Indianapolis', city: 'Indianapolis', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Knox', city: 'Knox', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Marengo', city: 'Marengo', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Petersburg', city: 'Petersburg', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Tell_City', city: 'Tell City', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Vevay', city: 'Vevay', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Vincennes', city: 'Vincennes', country: 'United States' },
  { code: 'US', name: 'America/Indiana/Winamac', city: 'Winamac', country: 'United States' },
  { code: 'US', name: 'America/Juneau', city: 'Juneau', country: 'United States' },
  { code: 'US', name: 'America/Kentucky/Louisville', city: 'Louisville', country: 'United States' },
  { code: 'US', name: 'America/Kentucky/Monticello', city: 'Monticello', country: 'United States' },
  { code: 'US', name: 'America/Los_Angeles', city: 'Los Angeles', country: 'United States' },
  { code: 'US', name: 'America/Menominee', city: 'Menominee', country: 'United States' },
  { code: 'US', name: 'America/Metlakatla', city: 'Metlakatla', country: 'United States' },
  { code: 'US', name: 'America/New_York', city: 'New York', country: 'United States' },
  { code: 'US', name: 'America/Nome', city: 'Nome', country: 'United States' },
  { code: 'US', name: 'America/North_Dakota/Beulah', city: 'Beulah', country: 'United States' },
  { code: 'US', name: 'America/North_Dakota/Center', city: 'Center', country: 'United States' },
  { code: 'US', name: 'America/North_Dakota/New_Salem', city: 'New Salem', country: 'United States' },
  { code: 'US', name: 'America/Phoenix', city: 'Phoenix', country: 'United States' },
  { code: 'US', name: 'America/Sitka', city: 'Sitka', country: 'United States' },
  { code: 'US', name: 'America/Yakutat', city: 'Yakutat', country: 'United States' },
  { code: 'UY', name: 'America/Montevideo', city: 'Montevideo', country: 'Uruguay' },
  { code: 'UZ', name: 'Asia/Samarkand', city: 'Samarkand', country: 'Uzbekistan' },
  { code: 'UZ', name: 'Asia/Tashkent', city: 'Tashkent', country: 'Uzbekistan' },
  { code: 'VA', name: 'Europe/Vatican', city: 'Vatican', country: 'Vatican City' },
  { code: 'VC', name: 'America/St_Vincent', city: 'St. Vincent', country: 'Saint Vincent and the Grenadines' },
  { code: 'VE', name: 'America/Caracas', city: 'Caracas', country: 'Venezuela' },
  { code: 'VG', name: 'America/Tortola', city: 'Tortola', country: 'British Virgin Islands' },
  { code: 'VI', name: 'America/St_Thomas', city: 'St. Thomas', country: 'United States Virgin Islands' },
  { code: 'VN', name: 'Asia/Phnom_Penh', city: 'Phnom Penh', country: 'Vietnam' },
  { code: 'VU', name: 'Pacific/Efate', city: 'Efate', country: 'Vanuatu' },
  { code: 'WF', name: 'Pacific/Wallis', city: 'Wallis', country: 'Wallis and Futuna' },
  { code: 'WS', name: 'Pacific/Apia', city: 'Apia', country: 'Samoa' },
  { code: 'WS', name: 'Pacific/Samoa', city: 'Samoa', country: 'Samoa' },
  { code: 'YE', name: 'Asia/Aden', city: 'Aden', country: 'Yemen' },
  { code: 'YT', name: 'Indian/Mayotte', city: 'Mayotte', country: 'Mayotte' },
  { code: 'ZA', name: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa' },
  { code: 'ZM', name: 'Africa/Lusaka', city: 'Lusaka', country: 'Zambia' },
  { code: 'ZW', name: 'Africa/Harare', city: 'Harare', country: 'Zimbabwe' }
]

/**
 * @description Get the timezone name from the timezone code
 * @param req - request object
 * @param res - response object
 */
const timezones = (req: NextApiRequest, res: NextApiResponse) => {

  // Get the timezone code from the request
  const searchKey = (req.query.search as string).toLowerCase();

  // if the search key is not provided, return none
  if (!searchKey) {
    return res.status(200).json([]);
  }

  // filter timezone list by the search key
  // search criteria is the timezone code / name / city / country / timezone abbreviation / offset
  // return the filtered timezone list
  res.status(200).json(timezoneList.filter(timezone => {
    const currentTime = getCurrentTime(timezone.name)
    return (
      timezone.name.toLowerCase().includes(searchKey) ||
      timezone.city.toLowerCase().includes(searchKey) ||
      timezone.code.toLowerCase().includes(searchKey) ||
      timezone.country.toLowerCase().includes(searchKey) ||
      currentTime.split(' ')[4].toLowerCase().includes(searchKey) ||
      currentTime.split("(")[1].split(")")[0].includes(searchKey)
    );
  }))
}

export default timezones;
