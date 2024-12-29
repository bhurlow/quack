// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "QuackDB",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "QuackDB", targets: ["QuackDB"])
    ],
    dependencies: [
        .package(url: "https://github.com/duckdb/duckdb-swift.git", from: "1.0.0")
    ],
    targets: [
        .executableTarget(
            name: "QuackDB",
            dependencies: [
                .product(name: "DuckDB", package: "duckdb-swift")
            ],
            path: "Sources/QuackDB"
        )
    ]
)
