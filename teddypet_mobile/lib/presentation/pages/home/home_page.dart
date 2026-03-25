import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:teddypet_mobile/presentation/providers/home/home_provider.dart';
import 'package:teddypet_mobile/presentation/pages/home/widgets/home/product_section.dart';
import 'package:teddypet_mobile/presentation/pages/home/widgets/main_header.dart';
import './widgets/home/category_menu.dart';
import './models/product_section_model.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeProvider>().fetchHomeData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: const MainHeader(),
      body: Consumer<HomeProvider>(
        builder: (context, homeProvider, child) {
          if (homeProvider.isLoading && homeProvider.categories.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (homeProvider.error != null && homeProvider.categories.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(homeProvider.error!, style: const TextStyle(color: Colors.red)),
                  ElevatedButton(
                    onPressed: () => homeProvider.fetchHomeData(),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => homeProvider.fetchHomeData(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  const CategoryMenu(),
                  const SizedBox(height: 10),

                  ProductSection(
                    model: ProductSectionModel(
                      title: 'Sản phẩm mới',
                      products: homeProvider.newArrivals,
                    ),
                  ),
                  const SizedBox(height: 10),

                  ProductSection(
                    model: ProductSectionModel(
                      title: 'Bán chạy',
                      products: homeProvider.bestSellers,
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

