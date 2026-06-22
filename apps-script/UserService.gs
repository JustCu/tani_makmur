/**
 * UserService.gs — Core operations for user management and authentication
 * Single Responsibility: Manages user sheet, registration, login, and authorization.
 */

// ============================================================
// Header definition for master_user sheet
// ============================================================
const USER_HEADERS = ['id', 'username', 'nama', 'whatsapp', 'password', 'salt', 'role', 'tanggal'];

/**
 * Ensures the user sheet is initialized and contains default admin seed if empty.
 */
function initUserSheet() {
  const sheet = getSheet(SHEET_NAMES.USER);
  const firstRow = sheet.getRange(1, 1, 1, USER_HEADERS.length).getValues()[0];
  
  if (firstRow[0] !== USER_HEADERS[0]) {
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]);
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setFontWeight('bold');
  }
  
  // Seed initial admin user if empty
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    const salt = generateSalt(16);
    const passwordHash = hashPassword('admin123', salt);
    const now = formatDate(new Date());
    
    sheet.appendRow([
      'U0001',
      'admin',
      'Administrator',
      '081999386550',
      passwordHash,
      salt,
      'admin',
      now
    ]);
    Logger.log('Default admin user successfully seeded: admin/admin123');
  }
}

/**
 * Generates a random salt string of a given length.
 * @param {number} length
 * @returns {string}
 */
function generateSalt(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return salt;
}

/**
 * Computes SHA-256 hash of password + salt.
 * @param {string} password
 * @param {string} salt
 * @returns {string} Hex representation of digest
 */
function hashPassword(password, salt) {
  const input = password + salt;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let hash = '';
  for (let i = 0; i < digest.length; i++) {
    let byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    let byteString = byteVal.toString(16);
    if (byteString.length === 1) byteString = '0' + byteString;
    hash += byteString;
  }
  return hash;
}

/**
 * Gets all user records from sheet (internal).
 * @returns {Object[]}
 */
function getUsersFromSheet() {
  initUserSheet();
  const sheet = getSheet(SHEET_NAMES.USER);
  const data = sheet.getDataRange().getValues();
  return arrayToObjects(data).filter(u => u.id !== '');
}

/**
 * Gets all user records (public view, omitting password and salt).
 * @returns {Object[]}
 */
function getAllUsers() {
  const users = getUsersFromSheet();
  return users.map(u => ({
    id: u.id,
    username: u.username,
    nama: u.nama,
    whatsapp: u.whatsapp,
    role: u.role,
    tanggal: u.tanggal
  }));
}

/**
 * authenticates user credentials.
 * @param {string} username
 * @param {string} password
 * @returns {Object} - User data without credentials on success
 */
function loginUser(username, password) {
  if (!username || !password) {
    throw new Error('Username dan Password wajib diisi');
  }
  
  const users = getUsersFromSheet();
  const lowerUsername = username.trim().toLowerCase();
  
  const user = users.find(u => u.username.toLowerCase() === lowerUsername);
  if (!user) {
    throw new Error('Username atau Password salah');
  }
  
  const incomingHash = hashPassword(password, user.salt);
  if (incomingHash !== user.password) {
    throw new Error('Username atau Password salah');
  }
  
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    whatsapp: user.whatsapp,
    role: user.role,
    tanggal: user.tanggal
  };
}

/**
 * Registers a new user. Only admins can register other users.
 * @param {Object} data - { username, nama, whatsapp, password, role }
 * @returns {Object} Created user (without password/salt)
 */
function registerUser(data) {
  const required = ['username', 'nama', 'whatsapp', 'password', 'role'];
  const validation = validateRequired(data, required);
  if (!validation.valid) {
    throw new Error(`Field wajib belum diisi: ${validation.missing.join(', ')}`);
  }
  
  const username = data.username.trim().toLowerCase();
  if (username.length < 3) {
    throw new Error('Username minimal 3 karakter');
  }
  
  // Check duplicates
  const users = getUsersFromSheet();
  if (users.some(u => u.username.toLowerCase() === username)) {
    throw new Error(`Username "${data.username}" sudah digunakan`);
  }
  
  const salt = generateSalt(16);
  const passwordHash = hashPassword(data.password, salt);
  const id = generateId('U');
  const dateStr = formatDate(new Date());
  
  const newUser = {
    id: id,
    username: username,
    nama: data.nama.trim(),
    whatsapp: data.whatsapp.trim(),
    role: data.role,
    tanggal: dateStr
  };
  
  const sheet = getSheet(SHEET_NAMES.USER);
  sheet.appendRow([
    newUser.id,
    newUser.username,
    newUser.nama,
    newUser.whatsapp,
    passwordHash,
    salt,
    newUser.role,
    newUser.tanggal
  ]);
  
  return newUser;
}

/**
 * Deletes a user by ID. Only admins can call this.
 * Prevents deleting the last admin.
 * @param {string} id
 * @returns {boolean}
 */
function deleteUser(id) {
  const users = getUsersFromSheet();
  const targetUser = users.find(u => u.id === id);
  
  if (!targetUser) {
    throw new Error('Pengguna tidak ditemukan');
  }
  
  if (targetUser.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      throw new Error('Tidak dapat menghapus satu-satunya administrator sistem');
    }
  }
  
  const sheet = getSheet(SHEET_NAMES.USER);
  const rowIndex = findRowByColumn(sheet, 0, id);
  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
    return true;
  }
  
  throw new Error('Gagal menghapus pengguna dari sheet');
}
