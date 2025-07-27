// Custom storage adapter using Cache API
export class CacheStorage {
  constructor(namespace = "supabase") {
    this.namespace = namespace;
    this.cacheName = `${namespace}-storage`;
  }

  async getItem(key) {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match(key);
      if (response) {
        const data = await response.text();
        return data;
      }
      return null;
    } catch (error) {
      console.error("Cache getItem error:", error);
      return null;
    }
  }

  async setItem(key, value) {
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(value);
      await cache.put(key, response);
    } catch (error) {
      console.error("Cache setItem error:", error);
    }
  }

  async removeItem(key) {
    try {
      const cache = await caches.open(this.cacheName);
      await cache.delete(key);
    } catch (error) {
      console.error("Cache removeItem error:", error);
    }
  }

  async clear() {
    try {
      await caches.delete(this.cacheName);
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }
}
