import request from '@/utils/request'

// 新增域名服务商
export function addDomainServiceProvider(data) {
  return request({
    url: '/api/v1/domain/provider',
    method: 'post',
    data
  })
}

// 删除域名服务商
export function deleteDomainServiceProvider(data) {
  return request({
    url: '/api/v1/domain/provider/' + data.id,
    method: 'delete'
  })
}

// 修改域名服务商
export function changeDomainServiceProvider(data) {
  return request({
    url: '/api/v1/domain/provider',
    method: 'put',
    data
  })
}

// 获取域名服务商列表
export function getDomainServiceProviderList() {
  return request({
    url: '/api/v1/domain/providers',
    method: 'get'
  })
}

// 新增域名
export function addDomain(data) {
  return request({
    url: '/api/v1/domain',
    method: 'post',
    data
  })
}

// 删除域名服务商
export function deleteDomain(data) {
  return request({
    url: '/api/v1/domain/' + data.id,
    method: 'delete'
  })
}

// 修改域名
export function changeDomain(data) {
  return request({
    url: '/api/v1/domain',
    method: 'put',
    data
  })
}

// 获取域名列表
export function getDomainList(params) {
  return request({
    url: '/api/v1/domains',
    method: 'get',
    params
  })
}
