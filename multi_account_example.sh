# 多帳號配置範例

# 方法1: 使用專案級配置
git config --local user.name 'Work Account'
git config --local user.email 'work@company.com'

# 方法2: 使用環境變數
GIT_AUTHOR_NAME='Personal Name' GIT_AUTHOR_EMAIL='personal@gmail.com' git commit

# 方法3: 使用不同的SSH密鑰
# ~/.ssh/config
# Host github-work
#     HostName github.com
#     User git
#     IdentityFile ~/.ssh/id_rsa_work

# 然後使用:
# git remote set-url origin git@github-work:user/repo.git
