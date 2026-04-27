import { v4 as uuidv4 } from 'uuid';

const DEVICE_KEY = '@clickdish:device_id';

export const getDeviceId = (): string => {
  // 1. Tenta recuperar do armazenamento local
  let storedId = localStorage.getItem(DEVICE_KEY);

  // 2. Se não existir, cria um novo uuid v4 e salva
  if (!storedId) {
    storedId = uuidv4();
    localStorage.setItem(DEVICE_KEY, storedId);
  }

  return storedId;
};