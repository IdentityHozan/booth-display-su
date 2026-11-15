// Compare and replace in one Redis operation so two admins cannot overwrite each other.
export const saveStateScript = `
local current = redis.call('GET', KEYS[1])
if current then
  local decoded = cjson.decode(current)
  if decoded.etag ~= ARGV[1] then return 0 end
elseif ARGV[1] ~= '' then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1
`;
