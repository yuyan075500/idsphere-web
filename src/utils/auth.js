import Cookies from 'js-cookie'

// 前端存储的Cookie名称
const TokenKey = window.location.host

export function getToken() {
  return Cookies.get(TokenKey)
}

export function setToken(token) {
  return Cookies.set(TokenKey, token)
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
