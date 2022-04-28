import { NextApiRequest, NextApiResponse } from "next"

export const timezoneList = [
  { code: 'IST', name: 'Asia/India Standard Time' },
  { code: 'EST', name: 'America/New_York' },
  { code: 'CST', name: 'America/Chicago' },
  { code: 'MST', name: 'America/Denver' },
  { code: 'PST', name: 'America/Los_Angeles' },
  { code: 'UTC', name: 'UTC' },
  { code: 'GMT', name: 'Europe/London' },
  { code: 'BST', name: 'Europe/London' },
  { code: 'CET', name: 'Europe/Berlin' },
  { code: 'EET', name: 'Europe/Athens' },
  { code: 'MSK', name: 'Europe/Moscow' },
  { code: 'JST', name: 'Asia/Tokyo' },
  { code: 'AEST', name: 'Australia/Sydney' },
  { code: 'ACST', name: 'Australia/Adelaide' },
  { code: 'AWST', name: 'Australia/Perth' },
  { code: 'NZST', name: 'Pacific/Auckland' },
  { code: 'NZDT', name: 'Pacific/Auckland' },
  { code: 'NZT', name: 'Pacific/Auckland' },
  { code: 'NZMT', name: 'Pacific/Auckland' },
  { code: 'NZST', name: 'Pacific/Auckland' },
  { code: 'NZDT', name: 'Pacific/Auckland' },
  { code: 'NZT', name: 'Pacific/Auckland' },
  { code: 'NZMT', name: 'Pacific/Auckland' },
  { code: 'NZST', name: 'Pacific/Auckland' },
  { code: 'NZDT', name: 'Pacific/Auckland' },
  { code: 'NZT', name: 'Pacific/Auckland' },
  { code: 'NZMT', name: 'Pacific/Auckland' },
]

export default function timezones(req: NextApiRequest, res: NextApiResponse) {

  const searchKey = req.query.search as string;
  console.log('>>>>', searchKey);

  if (!searchKey) {
    res.status(200).json([]);
  }

  const filteredTimezones = timezoneList.filter(timezone => {
    return (timezone.name.toLowerCase().includes(searchKey.toLowerCase()) || timezone.code.toLowerCase().includes(searchKey.toLowerCase()));
  });

  res.status(200).json(filteredTimezones)
}
