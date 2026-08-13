export const WRAPPED_YEAR_QUERY = `
  query WrappedYear($from: DateTime!, $to: DateTime!) {
    viewer {
      login
      name
      avatarUrl
      bio
      company
      location
      websiteUrl
      isHireable
      createdAt
      followers {
        totalCount
      }
      following {
        totalCount
      }
      pinnedItems(first: 6, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            nameWithOwner
          }
        }
      }
      publicRepositories: repositories(
        privacy: PUBLIC
        ownerAffiliations: OWNER
      ) {
        totalCount
      }
      forkedRepositories: repositories(
        isFork: true
        ownerAffiliations: OWNER
      ) {
        totalCount
      }
      archivedRepositories: repositories(
        isArchived: true
        ownerAffiliations: OWNER
      ) {
        totalCount
      }
      publicGists: gists(privacy: PUBLIC) {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        totalRepositoriesWithContributedPullRequests
        totalRepositoriesWithContributedIssues
        totalRepositoriesWithContributedPullRequestReviews
        totalRepositoryContributions
        repositoryContributions(first: 100) {
          totalCount
          nodes {
            repository {
              nameWithOwner
              isFork
              createdAt
            }
          }
        }
        restrictedContributionsCount
        hasAnyRestrictedContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            name
            nameWithOwner
            isPrivate
            owner {
              __typename
              login
            }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                node {
                  name
                  color
                }
                size
              }
            }
          }
        }
        pullRequestContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            nameWithOwner
          }
        }
        issueContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            nameWithOwner
          }
        }
        pullRequestReviewContributionsByRepository(maxRepositories: 100) {
          contributions {
            totalCount
          }
          repository {
            nameWithOwner
          }
        }
      }
    }
  }
`;

export const OWNED_REPOS_QUERY = `
  query OwnedReposSample {
    viewer {
      privateRepositories: repositories(
        privacy: PRIVATE
        ownerAffiliations: OWNER
      ) {
        totalCount
      }
      privateGists: gists(privacy: SECRET) {
        totalCount
      }
      mostStarredRepository: repositories(
        first: 1
        ownerAffiliations: OWNER
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          stargazerCount
          forkCount
          createdAt
          updatedAt
          isPrivate
          isFork
          isArchived
          isTemplate
          watchers {
            totalCount
          }
          primaryLanguage {
            name
            color
          }
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            totalCount
            edges {
              size
              node {
                name
                color
              }
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          licenseInfo {
            name
            spdxId
          }
        }
      }
      ownedRepositoriesSample: repositories(
        first: 50
        ownerAffiliations: OWNER
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        totalCount
        nodes {
          nameWithOwner
          name
          stargazerCount
          forkCount
          createdAt
          updatedAt
          isPrivate
          isFork
          isArchived
          isTemplate
          watchers {
            totalCount
          }
          primaryLanguage {
            name
            color
          }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            totalCount
            edges {
              size
              node {
                name
                color
              }
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          licenseInfo {
            name
            spdxId
          }
        }
      }
      oldestOwnedRepository: repositories(
        first: 1
        ownerAffiliations: OWNER
        orderBy: { field: CREATED_AT, direction: ASC }
      ) {
        nodes {
          nameWithOwner
          createdAt
          updatedAt
          stargazerCount
          forkCount
          isPrivate
          watchers {
            totalCount
          }
        }
      }
      newestOwnedRepository: repositories(
        first: 1
        ownerAffiliations: OWNER
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        nodes {
          nameWithOwner
          createdAt
          updatedAt
          stargazerCount
          forkCount
          isPrivate
          watchers {
            totalCount
          }
        }
      }
    }
  }
`;

export const ORGANIZATIONS_QUERY = `
  query ViewerOrganizations {
    viewer {
      organizations(first: 50) {
        totalCount
        nodes {
          login
        }
      }
    }
  }
`;

export const SOCIAL_LOGINS_QUERY = `
  query SocialLogins($followersCursor: String, $followingCursor: String) {
    viewer {
      followers(first: 100, after: $followersCursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          login
        }
      }
      following(first: 100, after: $followingCursor) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          login
        }
      }
    }
  }
`;
