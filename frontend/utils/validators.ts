export const Validators = {
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= 6;
  },

  name: (name: string): boolean => {
    return name.trim().length >= 2;
  },

  required: (value: string): boolean => {
    return value.trim().length > 0;
  }
};