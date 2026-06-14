# The Bad-Attitude Guide to Computer Security

![1.jpg](./assets/1-20231123113518-hvkf2dc.jpg)

![2.jpg](./assets/2-20231123113518-ymrjd8d.jpg)

## Build your own cryptographic protocol

![3.jpg](./assets/3-20231123113518-qicypeb.jpg)

![4.jpg](./assets/4-20231123113518-ony15hx.jpg)

![5.jpg](./assets/5-20231123113518-z5kvla9.jpg)

![6.jpg](./assets/6-20231123113518-b10m5mx.jpg)

[OCB mode](https://en.wikipedia.org/wiki/OCB_mode)

![7.jpg](./assets/7-20231123113518-vahmjyn.jpg)

![8.jpg](./assets/8-20231123113518-4uw2eja.jpg)

![9.jpg](./assets/9-20231123113518-1o6ur4o.jpg)

![10.jpg](./assets/10-20231123113518-3gd8b5m.jpg)

![11.jpg](./assets/11-20231123113518-xmwklb9.jpg)

![12.jpg](./assets/12-20231123113518-r7bay0z.jpg)

![13.jpg](./assets/13-20231123113518-q7p2pja.jpg)

![14.jpg](./assets/14-20231123113518-mn3mdp0.jpg)

![15.jpg](./assets/15-20231123113518-i3s8r4s.jpg)

## Language aren't that safe

![16.jpg](./assets/16-20231123113518-clyzftb.jpg)

![17.jpg](./assets/17-20231123113518-c9ik6g1.jpg)

![18.jpg](./assets/18-20231123113518-ubcl2lr.jpg)

![19.jpg](./assets/19-20231123113518-5z0npod.jpg)

![20.jpg](./assets/20-20231123113518-votkqw6.jpg)

![21.jpg](./assets/21-20231123113518-3knjjrb.jpg)

![22.jpg](./assets/22-20231123113518-vkgdh6c.jpg)

## HTTPS is bads

![23.jpg](./assets/23-20231123113518-pbgetv4.jpg)

![24.jpg](./assets/24-20231123113518-7s2ozlz.jpg)

![25.jpg](./assets/25-20231123113518-zglulqv.jpg)

173 家公司的列表中存在一家公司，该公司曾经证明我的 URL 栏中域名的 WHOIS 联系电子邮件属于现在控制我正在通话的服务器的同一个人

![26.jpg](./assets/26-20231123113518-e5590m8.jpg)

![27.jpg](./assets/27-20231123113518-0ayhyi0.jpg)

![28.jpg](./assets/28-20231123113518-x4j4yzy.jpg)

MITM：Man In The Middle 中间人攻击

![29.jpg](./assets/29-20231123113518-zn5gywq.jpg)

![30.jpg](./assets/30-20231123113518-ds27kc9.jpg)

### https对称加密的秘钥

在集群环境中，保证对称加密密钥的稳定性是一个挑战。对称加密使用相同的密钥进行加密和解密，因此密钥的安全性和稳定性对于保护加密数据至关重要。以下是在集群环境中保证对称加密密钥稳定的常用方法：

- 密钥管理系统（Key Management System，KMS）：使用专门的密钥管理系统来集中管理和保护对称加密密钥。KMS提供安全的密钥存储、访问控制和密钥生命周期管理。它可以确保密钥在集群环境中的安全传输、存储和使用。
- 密钥轮换（Key Rotation）：定期更换对称加密密钥是一种有效的安全措施。密钥轮换可以减少密钥被破解或泄露的风险，同时保证密钥的稳定性。在集群环境中，密钥轮换可以通过自动化脚本或密钥管理系统来实现。
- 密钥备份和恢复：在集群环境中，备份对称加密密钥是一项重要的操作。密钥备份可以保证密钥在故障或灾难情况下的恢复性。备份密钥应存储在安全的位置，并采取适当的访问控制措施，以防止未经授权的访问。
- 访问控制和权限管理：在集群环境中，对对称加密密钥的访问进行严格的控制是必要的。只有经过授权的用户或服务能够访问密钥，并执行加密和解密操作。访问控制和权限管理机制可以通过身份验证、授权策略和访问日志来实现。
- 安全传输和存储：在集群环境中，对称加密密钥的安全传输和存储也是至关重要的。密钥传输应使用安全的通信通道，如SSL/TLS，以防止密钥被窃取或篡改。密钥存储应采用安全的存储机制，如加密的数据库或密钥管理系统。
- 监控和审计：对对称加密密钥的使用进行监控和审计是集群环境中的另一个重要方面。监控可以及时发现异常活动或未经授权的访问，审计日志可以提供对密钥使用情况的审计和追踪。

综上所述，通过密钥管理系统、密钥轮换、密钥备份和恢复、访问控制和权限管理、安全传输和存储，以及监控和审计等措施，可以在集群环境中保证对称加密密钥的稳定性和安全性。这些措施的组合取决于具体的集群架构和安全要求。

![31.jpg](./assets/31-20231123113518-06wbmr9.jpg)

## Password Hashing is bad

![32.jpg](./assets/32-20231123113518-nkciulf.jpg)

![33.jpg](./assets/33-20231123113518-pi0n9he.jpg)

![34.jpg](./assets/34-20231123113518-e3nz42m.jpg)

![35.jpg](./assets/35-20231123113518-rnd3ua4.jpg)

## Forward secrecy is bad

![36.jpg](./assets/36-20231123113518-n1py7t7.jpg)

![37.jpg](./assets/37-20231123113518-irr7xbp.jpg)

![38.jpg](./assets/38-20231123113518-31fke94.jpg)

**完全前向保密**（Perfect Forward Secrecy，PFS）

密钥轮换（Key Rotation）：定期更换对称加密密钥是一种有效的安全措施。密钥轮换可以减少密钥被破解或泄露的风险，同时保证密钥的稳定性。在集群环境中，密钥轮换可以通过自动化脚本或密钥管理系统来实现。

![39.jpg](./assets/39-20231123113518-d8jun41.jpg)

![40.jpg](./assets/40-20231123113518-ysls5rw.jpg)

## End-to-end security is bad

![41.jpg](./assets/41-20231123113518-o9h4g2g.jpg)

![42.jpg](./assets/42-20231123113518-rp42xiy.jpg)

![43.jpg](./assets/43-20231123113518-a18njif.jpg)

[defense-in-depth](https://zhuanlan.zhihu.com/p/527853086): 深度防御

![44.jpg](./assets/44-20231123113518-uhbb2qe.jpg)

![45.jpg](./assets/45-20231123113518-xt0pg35.jpg)

![46.jpg](./assets/46-20231123113518-lhrugcr.jpg)

## Snowden docs shouldn't have changed our behavior

![47.jpg](./assets/47-20231123113518-vmakvpz.jpg)

![48.jpg](./assets/48-20231123113518-l2of5gl.jpg)

line eater 删行程序

![49.jpg](./assets/49-20231123113518-a5uz3ih.jpg)

![50.jpg](./assets/50-20231123113518-h0huijo.jpg)

![51.jpg](./assets/51-20231123113518-3e10w64.jpg)

![52.jpg](./assets/52-20231123113518-na4g73w.jpg)

![53.jpg](./assets/53-20231123113518-k9ngdb1.jpg)

![54.jpg](./assets/54-20231123113518-ncfk083.jpg)

![55.jpg](./assets/55-20231123113518-nm99kwj.jpg)

FISA (Foreign Intelligence Surveillance Act 外国情报监听法)

![56.jpg](./assets/56-20231123113518-4svguwg.jpg)

FAA (Federal Aviation Administration 美国联邦航空管理局)

![57.jpg](./assets/57-20231123113518-j8qq255.jpg)

![58.jpg](./assets/58-20231123113518-i4horpm.jpg)

![59.jpg](./assets/59-20231123113518-5f682pn.jpg)

![60.jpg](./assets/60-20231123113518-00m48y0.jpg)

![61.jpg](./assets/61-20231123113518-si70tf6.jpg)

## Auto-updating without consent is bad

![62.jpg](./assets/62-20231123113518-xxawogv.jpg)

![63.jpg](./assets/63-20231123113518-au6nsn8.jpg)

![64.jpg](./assets/64-20231123113518-uc9zlet.jpg)

![65.jpg](./assets/65-20231123113518-q54t2t0.jpg)
